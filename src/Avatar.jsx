function Avatar({ member }) {
  if (member.avatar_url) {
    return <img className="avatar" src={member.avatar_url} alt={member.name} title={member.name} />
  }

  const initials = member.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()

  return (
    <span className="avatar" style={{ background: member.color }} title={member.name}>
      {initials}
    </span>
  )
}

export default Avatar
