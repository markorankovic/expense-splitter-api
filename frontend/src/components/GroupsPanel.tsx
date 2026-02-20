import { useEffect, useState, type SubmitEvent } from 'react';
import { useGroups } from '../contexts/GroupContext';

export function GroupsPanel() {
  const {
    groups,
    groupsLoading,
    groupsError,
    activeGroupId,
    fetchGroups,
    createGroup,
    selectActiveGroup,
  } = useGroups();
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    void fetchGroups().catch(() => {});
  }, [fetchGroups]);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupName.trim()) {
      return;
    }
    try {
      await createGroup(groupName.trim());
      await fetchGroups();
      setGroupName('');
    } catch {
      return;
    }
  };

  return (
    <div className="groups">
      <h2 className="subtitle">Groups</h2>
      <form onSubmit={handleSubmit} className="form inline">
        <label className="label">
          New group
          <input
            className="input"
            type="text"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Weekend trip"
            required
          />
        </label>
        <button className="button" type="submit" disabled={!groupName.trim()}>
          Create
        </button>
      </form>

      {groupsError ? <p className="error">{groupsError}</p> : null}
      {groupsLoading ? <span className="muted">Loading...</span> : null}
      {groups.length === 0 && !groupsLoading ? (
        <p className="muted">No groups yet.</p>
      ) : (
        <ul className="groups-list">
          {groups.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                className={`group-button${activeGroupId === group.id ? ' active' : ''}`}
                onClick={() => selectActiveGroup(group.id)}
              >
                {group.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
