import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatPanel from "../components/messages/ChatPanel";
import ConversationList from "../components/messages/ConversationList";
import { useAuth } from "../context/auth-context";
import { api } from "../services/api";
import {
  ensureConversation,
  hideConversation,
  listenToConversations,
  listenToMessages,
  markConversationRead,
  sendMessage,
} from "../services/messages";

function databaseErrorMessage(error, area) {
  if (error?.code === "PERMISSION_DENIED" || error?.code === "permission-denied") {
    return `Database permission was denied while opening ${area}. Sign out, sign in again, then retry.`;
  }
  return error?.message || `Could not open ${area}.`;
}

export default function Messages() {
  const { user, profile } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [otherProfile, setOtherProfile] = useState(null);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile],
  );
  const [loading, setLoading] = useState(Boolean(userId));
  const [sending, setSending] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    let stopListening = () => {};

    async function openHistory() {
      try {
        await user.getIdToken(true);
        if (!active) return;
        stopListening = listenToConversations(
          user.uid,
          setContacts,
          (databaseError) =>
            active &&
            setError(
              databaseErrorMessage(databaseError, "your conversation history"),
            ),
        );
      } catch (historyError) {
        if (active) {
          setError(databaseErrorMessage(historyError, "your conversation history"));
        }
      }
    }

    openHistory();
    return () => {
      active = false;
      stopListening();
    };
  }, [user]);

  useEffect(() => {
    if (!userId || !user) return undefined;
    if (userId === user.uid) {
      navigate("/account", { replace: true });
      return undefined;
    }

    let active = true;
    let stopListening = () => {};

    async function openConversation() {
      setLoading(true);
      setError("");
      try {
        await user.getIdToken(true);
        const targetProfile = await api.getProfile(userId);
        if (!active) return;
        setOtherProfile(targetProfile);
        const id = await ensureConversation(user, profile, targetProfile);
        if (!active) return;
        setConversationId(id);
        stopListening = listenToMessages(
          id,
          (items) => {
            if (!active) return;
            setMessages(items);
            markConversationRead(user.uid, id).catch((readError) =>
              setError(databaseErrorMessage(readError, "this conversation")),
            );
          },
          (databaseError) =>
            active &&
            setError(databaseErrorMessage(databaseError, "this conversation")),
        );
      } catch (requestError) {
        if (active) {
          setError(databaseErrorMessage(requestError, "this conversation"));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    openConversation();
    return () => {
      active = false;
      stopListening();
    };
  }, [navigate, profile, user, userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function selectImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("The image must be 10 MB or smaller.");
      return;
    }
    setError("");
    setImageFile(file);
  }

  async function submit(event) {
    event.preventDefault();
    if ((!text.trim() && !imageFile) || !otherProfile || sending) return;
    setSending(true);
    setError("");
    try {
      const token = imageFile ? await user.getIdToken() : "";
      const uploadedImage = imageFile
        ? await api.uploadMessageImage(token, imageFile)
        : null;
      await sendMessage({
        currentUser: user,
        currentProfile: profile,
        otherProfile,
        text,
        imageUrl: uploadedImage?.url,
      });
      setText("");
      setImageFile(null);
    } catch (sendError) {
      setError(databaseErrorMessage(sendError, "this conversation"));
    } finally {
      setSending(false);
    }
  }

  async function removeMessage(messageId) {
    setError("");
    try {
      const token = await user.getIdToken();
      await api.deleteMessage(token, conversationId, messageId);
    } catch (deleteError) {
      setError(databaseErrorMessage(deleteError, "this conversation"));
      throw deleteError;
    }
  }

  async function removeConversation(contact) {
    if (
      !window.confirm(
        "Remove this conversation from your list? It will remain visible to the other person and the messages will not be deleted.",
      )
    ) {
      return;
    }
    setDeletingConversationId(contact.id);
    setError("");
    try {
      await hideConversation(user.uid, contact.id);
      if (contact.otherUserId === userId) navigate("/messages", { replace: true });
    } catch (deleteError) {
      setError(databaseErrorMessage(deleteError, "your conversation history"));
    } finally {
      setDeletingConversationId("");
    }
  }

  return (
    <section className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-10">
      <header className="mb-7 border-b border-neutral-800 pb-6">
        <p className="mb-3 font-mono text-[9px] tracking-[1.5px] text-neutral-400">
          PRIVATE CHANNEL / REALTIME DATABASE
        </p>
        <h1 className="text-4xl tracking-[-1.5px]">Messages.</h1>
      </header>
      <div className="grid h-[calc(100vh-220px)] min-h-[520px] max-h-[760px] grid-cols-[300px_1fr] overflow-hidden border border-neutral-700 max-[760px]:h-[calc(100vh-170px)] max-[760px]:grid-cols-1 max-[760px]:grid-rows-[auto_1fr]">
        <ConversationList
          contacts={contacts}
          activeUserId={userId}
          deletingId={deletingConversationId}
          onDelete={removeConversation}
        />
        <ChatPanel
          userId={userId}
          currentUserId={user.uid}
          otherProfile={otherProfile}
          messages={messages}
          loading={loading}
          conversationReady={Boolean(conversationId)}
          text={text}
          imagePreview={imagePreview}
          sending={sending}
          error={error}
          endRef={endRef}
          onTextChange={setText}
          onImageChange={selectImage}
          onImageRemove={() => setImageFile(null)}
          onDeleteMessage={removeMessage}
          onSubmit={submit}
        />
      </div>
    </section>
  );
}
