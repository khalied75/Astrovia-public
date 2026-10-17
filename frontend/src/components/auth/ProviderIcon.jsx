export default function ProviderIcon({ provider }) {
  if (provider === "apple") {
    return (
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M17.1 12.5c0-2.8 2.3-4.1 2.4-4.2a5.2 5.2 0 0 0-4.1-2.2c-1.8-.2-3.4 1-4.3 1s-2.2-1-3.7-1C5.5 6.2 3.6 7.3 2.6 9c-2.1 3.7-.5 9.1 1.5 12.1 1 1.5 2.2 3.1 3.8 3 1.5-.1 2.1-1 3.9-1s2.3 1 3.9 1c1.6 0 2.7-1.5 3.7-3 1.2-1.7 1.7-3.4 1.7-3.5-.1 0-4-1.5-4-5.1ZM14.2 4.2A5 5 0 0 0 15.4.5a5.1 5.1 0 0 0-3.4 1.8A4.7 4.7 0 0 0 10.8 6a4.2 4.2 0 0 0 3.4-1.8Z"
          transform="scale(.9) translate(1.3 0)"
        />
      </svg>
    );
  }

  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#fff"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z"
      />
      <path
        fill="#aaa"
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#ddd"
        d="M6.5 14a6 6 0 0 1 0-3.9V7.5H3.2a10 10 0 0 0 0 9.1L6.5 14Z"
      />
      <path
        fill="#777"
        d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.2 7.5l3.3 2.6a5.9 5.9 0 0 1 5.5-4Z"
      />
    </svg>
  );
}
