import "./App.css";
import useUser from "./hooks/useUser";
import Login from "./login/Login";
import useTeamMembers from "./hooks/useTeamMembers";
import BoardPage from "./pages/boardPage";

function App() {
  const { user, loading, returningUser } = useUser();
  const { members } = useTeamMembers(user?.id);
  const needsProfile = returningUser && members.length === 0;

  if (loading) return <div className="loading_screen">Loading Workspace...</div>;

  return <div className="app_root">{needsProfile ? <Login user={user} /> : <BoardPage user={user} />}</div>;
}

export default App;
