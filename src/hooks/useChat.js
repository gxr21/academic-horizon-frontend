import { useState, useEffect, useCallback, useRef } from 'react';
import { connectSocket, joinRoom, leaveRoom, sendSocketMessage, emitTyping, emitStopTyping } from '../lib/socket.js';
import { chatAPI, userAPI, authAPI } from '../lib/api.js';
import { encryptMessage, decryptMessage, getStoredPrivateKey, getStoredPublicKey, getStoredPublicKeyBase64, generateAndStoreKeyPair, importPublicKey } from '../lib/crypto.js';
import { getToken } from '../lib/authStorage.js';

/**
 * Make sure the server stores the public key that matches the private key
 * kept in this browser. Messages wrapped for any other key cannot be read here.
 */
const publishLocalPublicKey = async (userId) => {
  let publicKey = await getStoredPublicKeyBase64(userId);
  if (!publicKey) {
    publicKey = await generateAndStoreKeyPair(userId);
  }
  try {
    const me = await authAPI.getMe();
    const serverKey = me.data?.user?.public_key || me.data?.user?.publicKey || '';
    if (serverKey !== publicKey) {
      await userAPI.updatePublicKey(publicKey);
    }
  } catch (err) {
    console.warn('Failed to publish public key:', err);
  }
};

/**
 * Custom hook for E2EE chat with Socket.io.
 *
 * Handles:
 * - Socket connection with JWT
 * - Room joining (access-controlled)
 * - Message encryption before sending
 * - Message decryption after receiving
 * - Paginated message history
 * - Typing indicators
 */
export const useChat = (orderId, currentUser) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const privateKeyRef = useRef(null);
  const recipientPublicKeyRef = useRef(null);
  const recipientKeyIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ─── Connect Socket ─────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const token = getToken();
    if (!token) return;

    const socket = connectSocket(token);

    // The socket is shared (notifications + chat) and may already be connected
    // when this hook mounts, in which case no new 'connect' event will fire.
    setIsConnected(socket.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => {
      setIsConnected(false);
      setIsJoined(false);
      setOnlineUserIds([]);
    };
    const onRoomJoined = (data) => {
      setIsJoined(true);
      // Who is already inside the conversation when we arrive
      setOnlineUserIds(Array.isArray(data?.online) ? data.online : []);
    };
    const onUserJoined = (data) => {
      if (!data?.userId) return;
      setOnlineUserIds((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
    };
    const onUserLeft = (data) => {
      if (!data?.userId) return;
      setOnlineUserIds((prev) => prev.filter((id) => id !== data.userId));
      // Someone who left has obviously stopped typing
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    };

    const onReceiveMessage = async (data) => {
      // Decrypt message
      const isOwn = data.senderId === currentUser.id;
      const decryptedText = await decryptIncoming(data, isOwn);
      setMessages((prev) => {
        // Avoid duplicates (e.g. message already loaded from history)
        if (prev.some((m) => m.id === data.id)) return prev;
        return [
          ...prev,
          {
            id: data.id,
            senderId: data.senderId,
            senderEmail: data.senderEmail,
            text: decryptedText,
            encryptedMessage: data.encryptedMessage,
            iv: data.iv,
            wrappedKey: data.wrappedKey,
            senderWrappedKey: data.senderWrappedKey,
            messageType: data.messageType,
            createdAt: data.createdAt,
            isOwn,
          },
        ];
      });
    };

    const onTyping = (data) => {
      if (data.userId !== currentUser.id) {
        setTypingUsers((prev) =>
          prev.includes(data.userId) ? prev : [...prev, data.userId]
        );
      }
    };

    const onStopTyping = (data) => {
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    };

    const onError = (data) => {
      console.error('Socket error:', data);
      setError(data.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_joined', onRoomJoined);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('receive_message', onReceiveMessage);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('error', onError);

    // Remove only OUR listeners — the socket itself stays alive for notifications
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_joined', onRoomJoined);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('receive_message', onReceiveMessage);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('error', onError);
    };
  }, [currentUser]);

  // ─── Join Room & Load Keys ──────────────────────────
  useEffect(() => {
    if (!orderId || !isConnected || !currentUser) return;

    // Set when the page is left (or the effect re-runs) while the async setup below is still going.
    // Without it the setup could join the room AFTER the visitor already left, and the other
    // person would see them as online while they are on another page.
    let cancelled = false;

    const initRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Publish this browser's public key if the server still has a different one
        await publishLocalPublicKey(currentUser.id);
        if (cancelled) return;

        // Load private key
        privateKeyRef.current = await getStoredPrivateKey(currentUser.id);
        if (cancelled) return;

        // Join socket room
        joinRoom(orderId);

        // Load message history
        await loadMessages(1);
      } catch (err) {
        if (cancelled) return;
        console.error('Room init error:', err);
        setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    initRoom();

    return () => {
      cancelled = true;
      leaveRoom(orderId);
      setIsJoined(false);
      setOnlineUserIds([]);
      setMessages([]);
    };
  }, [orderId, isConnected, currentUser]);

  // ─── Load Recipient's Public Key ────────────────────
  const loadRecipientKey = useCallback(async (recipientId) => {
    if (!recipientId) return;
    try {
      const response = await userAPI.getPublicKey(recipientId);
      const publicKey = response.data?.publicKey;
      if (!publicKey) {
        if (recipientKeyIdRef.current === recipientId) {
          recipientPublicKeyRef.current = null;
          recipientKeyIdRef.current = null;
        }
        return;
      }
      const key = await importPublicKey(publicKey);
      recipientKeyIdRef.current = recipientId;
      recipientPublicKeyRef.current = key;
    } catch (err) {
      console.error('Failed to load recipient public key:', err);
      if (recipientKeyIdRef.current === recipientId) {
        recipientPublicKeyRef.current = null;
        recipientKeyIdRef.current = null;
      }
    }
  }, []);

  // ─── Decrypt Incoming Message ───────────────────────
  const decryptIncoming = async (data, isOwn = false) => {
    // Plain fallback: sent when the recipient had no public key at send time
    // (no wrappedKey at all) — the content is just base64(encodeURIComponent(text)).
    if (!data.wrappedKey && !data.senderWrappedKey) {
      try {
        return decodeURIComponent(atob(data.encryptedMessage));
      } catch {
        return 'تعذر قراءة الرسالة';
      }
    }

    if (!privateKeyRef.current) {
      return 'تعذر قراءة الرسالة';
    }

    // Prefer the wrap meant for us, then the other one. The second attempt
    // covers messages saved while two accounts shared one login token.
    const wrappedKeys = isOwn
      ? [data.senderWrappedKey, data.wrappedKey]
      : [data.wrappedKey, data.senderWrappedKey];

    for (const wrappedKey of wrappedKeys) {
      if (!wrappedKey) continue;
      try {
        return await decryptMessage(
          {
            encryptedMessage: data.encryptedMessage,
            iv: data.iv,
            wrappedKey,
          },
          privateKeyRef.current
        );
      } catch {
        // try the other wrap
      }
    }

    return 'تعذر قراءة الرسالة';
  };

  // ─── Load Message History ───────────────────────────
  const loadMessages = useCallback(
    async (page = 1) => {
      try {
        const response = await chatAPI.getMessages(orderId, { page, limit: 20 });
        const decryptedMessages = await Promise.all(
          (response.data || []).map(async (msg) => {
            const text = await decryptIncoming(msg, msg.senderId === currentUser?.id);
            return {
              id: msg.id,
              senderId: msg.senderId,
              sender: msg.sender,
              text,
              encryptedMessage: msg.encryptedMessage,
              iv: msg.iv,
              wrappedKey: msg.wrappedKey,
              messageType: msg.messageType,
              createdAt: msg.createdAt,
              isOwn: msg.senderId === currentUser?.id,
            };
          })
        );

        if (page === 1) {
          setMessages(decryptedMessages);
        } else {
          setMessages((prev) => [...decryptedMessages, ...prev]);
        }

        if (response.pagination) {
          setPagination(response.pagination);
        }
      } catch (err) {
        console.error('Load messages error:', err);
      }
    },
    [orderId, currentUser]
  );

  // ─── Admin keys (safety review) ────────────────────
  // Public keys of the admins; the AES key of every message is also wrapped for them.
  const adminKeysRef = useRef(null);
  const loadAdminKeys = useCallback(async () => {
    if (adminKeysRef.current) return adminKeysRef.current;
    try {
      const response = await chatAPI.getAdminKeys();
      const keys = await Promise.all(
        (response.data?.keys || []).map(async (k) => ({
          adminId: k.adminId,
          key: await importPublicKey(k.publicKey),
        }))
      );
      // Only cache a non-empty list, so a late-registering admin key is picked up
      if (keys.length > 0) adminKeysRef.current = keys;
      return keys;
    } catch (err) {
      console.warn('Failed to load admin keys:', err);
      return [];
    }
  }, []);

  // ─── Send Message ──────────────────────────────────
  const sendMessage = useCallback(
    async (plaintext, recipientId) => {
      if (!plaintext.trim()) return;
      if (!orderId) {
        setError('لا يوجد طلب مرتبط بهذه المحادثة');
        return;
      }

      try {
        // Always read the recipient's current public key. A cached key from
        // before they re-synced this browser cannot open the message.
        if (recipientId) {
          await loadRecipientKey(recipientId);
        }

        let messageData;

        const recipientKey =
          recipientKeyIdRef.current === recipientId ? recipientPublicKeyRef.current : null;

        if (recipientKey) {
          // Encrypt with hybrid encryption
          // Also wrap the AES key for ourselves so we can read our own messages
          const ownPublicKey = currentUser?.id ? await getStoredPublicKey(currentUser.id) : null;
          // ...and for the admins, so conversations can be reviewed for safety
          const adminKeys = await loadAdminKeys();
          const encrypted = await encryptMessage(
            plaintext,
            recipientKey,
            ownPublicKey,
            adminKeys
          );
          messageData = {
            orderId,
            encryptedMessage: encrypted.encryptedMessage,
            iv: encrypted.iv,
            wrappedKey: encrypted.wrappedKey,
            senderWrappedKey: encrypted.senderWrappedKey,
            adminWrappedKeys: encrypted.adminWrappedKeys,
            messageType: 'text',
          };
        } else {
          // Fallback: send as base64 encoded (not truly encrypted, but for demo)
          messageData = {
            orderId,
            encryptedMessage: btoa(encodeURIComponent(plaintext)),
            iv: btoa(String(Date.now())),
            wrappedKey: '',
            messageType: 'text',
          };
        }

        // Send via socket
        sendSocketMessage(messageData);
      } catch (err) {
        console.error('Send message error:', err);
        setError('Failed to send message');
      }
    },
    [orderId, loadRecipientKey, loadAdminKeys, currentUser]
  );

  // ─── Typing Indicators ─────────────────────────────
  const handleTyping = useCallback(() => {
    if (orderId) {
      emitTyping(orderId);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(orderId);
      }, 2000);
    }
  }, [orderId]);

  // ─── Load More Messages ─────────────────────────────
  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages) {
      loadMessages(pagination.page + 1);
    }
  }, [pagination, loadMessages]);

  return {
    messages,
    isConnected,
    isJoined,
    isLoading,
    error,
    typingUsers,
    onlineUserIds,
    pagination,
    sendMessage,
    handleTyping,
    loadMore,
    loadRecipientKey,
  };
};

export default useChat;
