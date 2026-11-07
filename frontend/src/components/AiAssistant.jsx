import React, { useState, useRef, useEffect } from "react";
import api from "../utils/api.js";
import { FiCpu, FiX, FiChevronUp, FiChevronDown, FiSend } from "react-icons/fi";

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm the AI scheduling assistant. Ask me anything about the timetable — courses, lecturers, venues, or schedules!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { message: userMsg });
      const answer = res.data.answer || "Sorry, I couldn't process that request.";
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I'm having trouble connecting. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // On quick question click, auto-send
  const handleQuickQuestion = (q) => {
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    api.post("/ai/chat", { message: q })
      .then((res) => {
        setMessages((prev) => [...prev, { role: "assistant", text: res.data.answer }]);
      })
      .catch(() => {
        setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, connection error." }]);
      })
      .finally(() => setLoading(false));
  };

  const quickQuestions = [
    "What courses are scheduled today?",
    "Which venues are free on Monday morning?",
    "Show me Dr. Ibrahim's schedule",
    "How many courses are unscheduled?",
  ];

  const chatHeight = expanded ? "500px" : "380px";

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.fab}
        title="AI Assistant"
      >
        {isOpen ? <FiX size={24} /> : <FiCpu size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="ai-assistant-panel" style={{ ...styles.panel, height: chatHeight }}>
          <div style={styles.header}>
            <div>
              <FiCpu size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
              <span style={styles.headerTitle}>AI Assistant</span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setExpanded(!expanded)}
                style={styles.headerBtn}
                title={expanded ? "Minimize" : "Expand"}
              >
                {expanded ? <FiChevronDown size={14} /> : <FiChevronUp size={14} />}
              </button>
              <button onClick={() => setIsOpen(false)} style={styles.headerBtn}>
                <FiX size={14} />
              </button>
            </div>
          </div>

          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.message,
                  ...(msg.role === "user" ? styles.userMsg : styles.assistantMsg),
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={styles.typing}>
                <span style={styles.typingDot} />
                <span style={{ ...styles.typingDot, animationDelay: "0.2s" }} />
                <span style={{ ...styles.typingDot, animationDelay: "0.4s" }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div style={styles.quickRow}>
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q)}
                  style={styles.quickBtn}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} style={styles.inputRow}>
            <input
              style={styles.input}
              placeholder="Ask about the schedule..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              <FiSend size={16} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

const styles = {
  fab: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #4285f4, #34a853)",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(66,133,244,0.4)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s",
  },
  panel: {
    position: "fixed",
    bottom: "92px",
    right: "24px",
    width: "380px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #e0e0e0",
    transition: "height 0.3s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #eee",
    background: "linear-gradient(135deg, #4285f4, #34a853)",
    color: "#fff",
  },
  headerTitle: { fontWeight: "600", fontSize: "15px" },
  headerBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "#fff",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  message: {
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
    maxWidth: "85%",
    whiteSpace: "pre-wrap",
  },
  userMsg: {
    background: "#4285f4",
    color: "#fff",
    alignSelf: "flex-end",
    borderBottomRightRadius: "4px",
  },
  assistantMsg: {
    background: "#f0f4f8",
    color: "#333",
    alignSelf: "flex-start",
    borderBottomLeftRadius: "4px",
  },
  typing: {
    display: "flex",
    gap: "4px",
    padding: "12px 16px",
    alignSelf: "flex-start",
  },
  typingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#94a3b8",
    animation: "dotPulse 1.4s infinite ease-in-out both",
  },
  quickRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    padding: "8px 16px",
    borderTop: "1px solid #eee",
  },
  quickBtn: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
    background: "#f8fafc",
    fontSize: "11px",
    color: "#555",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "170px",
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    padding: "10px 16px",
    borderTop: "1px solid #eee",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "10px",
    border: "2px solid #e0e0e0",
    fontSize: "14px",
    outline: "none",
  },
  sendBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    border: "none",
    background: "#4285f4",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default AiAssistant;
