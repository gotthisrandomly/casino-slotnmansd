export default function Home() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Slot King Casino</h1>
      <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>A simple casino game</p>

      <div
        style={{
          backgroundColor: "#f1f5f9",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Static Demo Version</h2>
        <p>
          This is a static demonstration of the Slot King Casino application. The interactive features have been
          disabled for this preview.
        </p>
      </div>
    </div>
  )
}

