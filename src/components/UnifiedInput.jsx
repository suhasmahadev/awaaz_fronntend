export default function UnifiedInput({
  value,
  onChange,
  onSubmit,
  onMic,
  micActive = false,
  disabled = false,
  loading = false,
  placeholder = "Type a message...",
  fileInputId = "unified-file-input",
  accept = "image/*",
  onFileSelect,
  onCameraClick,
  fileActive = false,
  compact = false,
  submitLabel,
}) {
  return (
    <form className={`unified-input ${compact ? "unified-input--compact" : ""}`} onSubmit={onSubmit}>
      <div className="unified-input__row">
        {onFileSelect && (
          <>
            <input
              type="file"
              accept={accept}
              capture={accept === "image/*" ? "environment" : undefined}
              id={fileInputId}
              className="unified-input__file-control"
              onChange={onFileSelect}
            />
            <label
              className={`unified-input__icon unified-input__file unified-input__camera ${fileActive ? "is-active" : ""}`}
              htmlFor={fileInputId}
              aria-label="Open camera"
              title="Open camera"
              onClick={(e) => {
                if (!onCameraClick) return;
                e.preventDefault();
                onCameraClick();
              }}
            />
          </>
        )}
        <input
          className="unified-input__field"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          className="unified-input__send"
          type="submit"
          disabled={disabled}
          aria-label={loading ? "Sending" : "Send"}
        >
          {submitLabel || (loading ? "..." : "Send")}
        </button>
      </div>
      <button
        className={`unified-input__mic ${micActive ? "is-listening" : ""}`}
        type="button"
        onClick={onMic}
        aria-label={micActive ? "Listening" : "Start voice input"}
      />
    </form>
  );
}
