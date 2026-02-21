import { useEffect, useState, type SubmitEvent } from 'react';
import { useGroups } from '../contexts/GroupContext';
import { useMe } from '../contexts/MeContext';

export function GroupsPanel() {
  const { meId } = useMe();
  const {
    groups,
    groupsLoading,
    groupsError,
    activeGroupId,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    selectActiveGroup,
  } = useGroups();
  const [groupName, setGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [groupStatus, setGroupStatus] = useState('');

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
      setGroupStatus('Group created.');
    } catch (err) {
      setGroupStatus(err instanceof Error ? err.message : 'Failed to create group');
      return;
    }
  };

  const handleRename = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingGroupId || !editName.trim()) {
      return;
    }
    setGroupStatus('');
    try {
      await updateGroup(editingGroupId, editName.trim());
      await fetchGroups();
      setEditingGroupId(null);
      setEditName('');
      setGroupStatus('Group updated.');
    } catch (err) {
      setGroupStatus(err instanceof Error ? err.message : 'Failed to update group');
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!groupId) {
      return;
    }
    setGroupStatus('');
    try {
      await deleteGroup(groupId);
      await fetchGroups();
      setGroupStatus('Group deleted.');
    } catch (err) {
      setGroupStatus(err instanceof Error ? err.message : 'Failed to delete group');
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
      {groupStatus ? (
        <p className={groupStatus.endsWith('.') && !groupStatus.startsWith('Failed') ? 'success' : 'error'}>
          {groupStatus}
        </p>
      ) : null}
      {groupsLoading ? <span className="muted">Loading...</span> : null}
      {groups.length === 0 && !groupsLoading ? (
        <p className="muted">No groups yet.</p>
      ) : (
        <ul className="groups-list">
          {groups.map((group) => (
            <li key={group.id}>
              {editingGroupId === group.id ? (
                <form onSubmit={handleRename} className="form inline group-edit-form">
                  <input
                    className="input"
                    type="text"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    placeholder="Updated group name"
                  />
                  <button className="button ghost" type="submit" disabled={!editName.trim()}>
                    ✓
                  </button>
                  <button
                    className="button ghost"
                    type="button"
                    aria-label="Cancel rename"
                    title="Cancel rename"
                    onClick={() => {
                      setEditingGroupId(null);
                      setEditName('');
                    }}
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <div className="group-row">
                  <button
                    type="button"
                    className={`group-button group-name${activeGroupId === group.id ? ' active' : ''}`}
                    onClick={() => selectActiveGroup(group.id)}
                    title={group.name}
                  >
                    {group.name}
                  </button>
                  <div className="group-actions">
                    <button
                      type="button"
                      className="button ghost"
                      aria-label="Rename group"
                      title={
                        group.ownerId === meId
                          ? 'Rename group'
                          : 'Only the group owner can rename'
                      }
                      disabled={group.ownerId !== meId}
                      onClick={() => {
                        setEditingGroupId(group.id);
                        setEditName(group.name);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="button ghost"
                      aria-label="Delete group"
                      title={
                        group.ownerId === meId
                          ? 'Delete group'
                          : 'Only the group owner can delete'
                      }
                      disabled={group.ownerId !== meId}
                      onClick={() => {
                        void handleDelete(group.id);
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
