import { useState } from "react";
import useTeamMembers from "../hooks/useTeamMembers";
import BoardPage from "../pages/boardPage";

function getColorFromName(name) {
  const colors = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6", "#a855f7"];
  let hash = 0;

  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function Login({ user }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const { addMember } = useTeamMembers(user.id);
  const [toggleBoard, setToggleBoard] = useState(() => JSON.parse(sessionStorage.getItem("toggleboard") ?? "false"));
  const [toggle, setToggle] = useState(false);

  function profile(e) {
    e.preventDefault();
    setColor(getColorFromName(name));
    setToggle(true);
  }

  async function addProfile() {
    await addMember({ name, color });
    sessionStorage.setItem("toggleboard", JSON.stringify(true));
    setToggleBoard(true);
  }

  if (toggleBoard) {
    return <BoardPage user={user} />;
  }

  return (
    <section className="auth_shell">
      <div className="auth_card">
        <div className="auth_copy">
          <span className="eyebrow">Welcome aboard</span>
          <h1>Set up your profile and start managing work beautifully.</h1>
          <p>
            Build a polished workspace with collaborative task lanes, clearer ownership, and fast drag-and-drop updates.
          </p>
        </div>

        {toggle ? (
          <div className="profile_preview">
            <div className="avatar_preview" style={{ backgroundColor: color }}>
              {name[0]?.toUpperCase()}
            </div>
            <div>
              <h2>{name}</h2>
              <p>This will be used on your task board avatar.</p>
            </div>
            <div className="task_inline_actions">
              <button className="primary_button" type="button" onClick={addProfile}>Create profile</button>
              <button className="secondary_button" type="button" onClick={() => setToggle(false)}>Edit name</button>
            </div>
          </div>
        ) : (
          <form className="auth_form" onSubmit={profile}>
            <label>
              <span>Full name</span>
              <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <button className="primary_button" type="submit">Continue</button>
          </form>
        )}
      </div>
    </section>
  );
}

export default Login;
