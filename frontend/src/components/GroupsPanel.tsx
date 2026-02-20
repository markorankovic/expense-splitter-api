import { useState, type SubmitEvent } from 'react';
import type { Group } from '../types';

type GroupsPanelProps = {
  groups: Group[];
  groupsLoading: boolean;
  groupsError: string;
  activeGroupId: string | null;
  onCreateGroup: (name: string) => Promise<boolean> | boolean;
  onSelectGroup: (groupId: string) => void;
};

export function GroupsPanel({
  groups,
  groupsLoading,
  groupsError,
  activeGroupId,
  onCreateGroup,
  onSelectGroup,
}: GroupsPanelProps) {
  const [groupName, setGroupName] = useState('');

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupName.trim()) {
      return;
    }
    const ok = await onCreateGroup(groupName.trim());
    if (ok) {
      setGroupName('');
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
                onClick={() => onSelectGroup(group.id)}
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
