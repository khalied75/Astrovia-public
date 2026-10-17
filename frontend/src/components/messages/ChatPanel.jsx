import { Link } from "react-router-dom";
import UserAvatar from "../UserAvatar";
import MessageBubble from "./MessageBubble";

function EmptyChat() {
  return (
    <div className="grid flex-1 place-items-center px-6 text-center">
      <div>
        <span className="text-3xl text-neutral-600">✦</span>
        <h2 className="mt-4 text-2xl">Select an observer.</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Your conversations will appear in the people list.
        </p>
      </div>
    </div>
  );
}

function MessageComposer({
  text,
  imagePreview,
  disabled,
  sending,
  onTextChange,
  onImageChange,
  onImageRemove,
  onSubmit,
}) {
  return (
    <form
      className="border-t border-neutral-800 p-4"
      onSubmit={onSubmit}
    >
      {imagePreview && (
        <div className="relative mb-3 w-fit border border-neutral-700 bg-neutral-900 p-2">
          <img
            className="max-h-32 max-w-52 object-contain"
            src={imagePreview}
            alt="Selected attachment preview"
          />
          <button
            type="button"
            className="absolute -right-2 -top-2 grid size-6 place-items-center border border-white bg-black text-xs text-white"
            onClick={onImageRemove}
            aria-label="Remove selected image"
            disabled={sending}
          >
            ×
          </button>
        </div>
      )}
      <div className="flex gap-3 max-[520px]:flex-col">
        <label
          className={`grid min-h-12 min-w-12 place-items-center border border-neutral-700 font-mono text-lg transition hover:border-white ${disabled || sending ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          title="Attach an image"
          aria-label="Attach an image"
        >
          +
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={onImageChange}
            disabled={disabled || sending}
          />
        </label>
        <textarea
          className="min-h-12 flex-1 resize-none border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          maxLength="2000"
          placeholder="Write a message..."
          disabled={disabled || sending}
        />
        <button
          className="min-w-28 border border-white bg-white px-5 font-mono text-[9px] text-black uppercase disabled:opacity-50 max-[520px]:min-h-12"
          disabled={disabled || sending || (!text.trim() && !imagePreview)}
        >
          {sending ? "Sending" : "Send →"}
        </button>
      </div>
    </form>
  );
}

export default function ChatPanel({
  userId,
  currentUserId,
  otherProfile,
  messages,
  loading,
  conversationReady,
  text,
  imagePreview,
  sending,
  error,
  endRef,
  onTextChange,
  onImageChange,
  onImageRemove,
  onDeleteMessage,
  onSubmit,
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
      {!userId ? (
        <EmptyChat />
      ) : (
        <>
          <header className="flex items-center gap-3 border-b border-neutral-800 p-4">
            <UserAvatar
              person={otherProfile}
              className="size-11 font-mono text-xs"
            />
            <div>
              <Link className="font-medium hover:underline" to={`/profile/${userId}`}>
                {otherProfile?.displayName || "Locating observer..."}
              </Link>
              <p className="font-mono text-[8px] text-neutral-500">
                @{otherProfile?.username || "observer"} / PRIVATE
              </p>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-5">
            {loading && (
              <p className="text-center font-mono text-[9px] text-neutral-600">
                OPENING SECURE CHANNEL...
              </p>
            )}
            {!loading && !messages.length && (
              <p className="py-10 text-center text-sm text-neutral-500">
                No messages yet. Start the conversation.
              </p>
            )}
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                mine={message.senderId === currentUserId}
                onDelete={onDeleteMessage}
              />
            ))}
            <div ref={endRef} />
          </div>

          <MessageComposer
            text={text}
            imagePreview={imagePreview}
            disabled={!conversationReady}
            sending={sending}
            onTextChange={onTextChange}
            onImageChange={onImageChange}
            onImageRemove={onImageRemove}
            onSubmit={onSubmit}
          />
        </>
      )}
      {error && (
        <p className="border-t border-red-950 px-4 py-3 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
