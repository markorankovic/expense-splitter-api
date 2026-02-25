import { useEffect, useState, type SubmitEvent } from 'react';
import { useBalancesAndSettle } from '../contexts/BalancesAndSettleContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useGroups } from '../contexts/GroupContext';
import { useMembers } from '../contexts/MemberContext';
import { useMe } from '../contexts/MeContext';

export function MembersPanel() {
  const { groups, activeGroupId } = useGroups();
  const { meId } = useMe();
  const { expensePage, fetchExpenses } = useExpenses();
  const { membersError, membersLoading, members, fetchMembers, addMember, removeMember } =
    useMembers();
  const { fetchBalancesAndSettle } = useBalancesAndSettle();
  const [memberEmail, setMemberEmail] = useState('');
  const [memberStatus, setMemberStatus] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const memberPageSize = 4;
  const orderedMembers = [...members].sort((a, b) => {
    const aIsMe = a.id === meId ? 1 : 0;
    const bIsMe = b.id === meId ? 1 : 0;
    return bIsMe - aIsMe;
  });
  const memberTotalPages = Math.max(1, Math.ceil(orderedMembers.length / memberPageSize));
  const paginatedMembers = orderedMembers.slice(
    (memberPage - 1) * memberPageSize,
    memberPage * memberPageSize,
  );

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    void fetchMembers(activeGroupId).catch(() => {});
  }, [activeGroupId, fetchMembers]);

  useEffect(() => {
    setMemberPage(1);
  }, [activeGroupId]);

  useEffect(() => {
    if (memberPage > memberTotalPages) {
      setMemberPage(memberTotalPages);
    }
  }, [memberPage, memberTotalPages]);

  if (!activeGroupId) {
    return null;
  }

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? null;
  const canManageMembers = activeGroup?.ownerId === meId;

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!memberEmail.trim()) {
      return;
    }
    setMemberStatus('');
    try {
      await addMember(activeGroupId, memberEmail.trim());
      setMemberStatus('Member added.');
      await fetchMembers(activeGroupId);
      await fetchBalancesAndSettle(activeGroupId);
      setMemberEmail('');
    } catch (err) {
      setMemberStatus(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  const handleRemove = async (memberId: string) => {
    setMemberStatus('');
    try {
      await removeMember(activeGroupId, memberId);
      await fetchMembers(activeGroupId);
      await fetchExpenses(activeGroupId, expensePage);
      await fetchBalancesAndSettle(activeGroupId);
      setMemberStatus('Member removed.');
    } catch (err) {
      setMemberStatus(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  return (
    <div className="members-card">
      <h2 className="subtitle">Members</h2>
      <form onSubmit={handleSubmit} className="form inline">
        <label className="label">
          Email
          <input
            className="input"
            type="email"
            value={memberEmail}
            onChange={(event) => setMemberEmail(event.target.value)}
            placeholder="person@example.com"
            required
          />
        </label>
        <button className="button" type="submit" disabled={!memberEmail.trim()}>
          Add
        </button>
      </form>
      {membersError ? <p className="error">{membersError}</p> : null}
      {memberStatus ? (
        <p className={memberStatus === 'Member added.' ? 'success' : 'error'}>
          {memberStatus}
        </p>
      ) : null}
      <div className="members-list">
        {membersLoading ? (
          <p className="muted">Loading members...</p>
        ) : members.length === 0 ? (
          <p className="muted">No members yet.</p>
        ) : (
          <ul>
            {paginatedMembers.map((member) => (
              <li key={member.id}>
                <div className="member-email-box">
                  <span className="member-email" title={member.email}>
                    {member.email}
                  </span>
                </div>
                <button
                  type="button"
                  className="button ghost member-action"
                  aria-label="Remove member"
                  title={
                    !canManageMembers
                      ? 'Only the group owner can remove members'
                      : member.id === meId
                        ? 'You cannot remove yourself'
                        : 'Remove member'
                  }
                  disabled={!canManageMembers || member.id === meId}
                  onClick={() => {
                    void handleRemove(member.id);
                  }}
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {orderedMembers.length > memberPageSize ? (
        <div className="pagination">
          <button
            type="button"
            className="button ghost"
            onClick={() => setMemberPage(Math.max(1, memberPage - 1))}
            disabled={memberPage === 1 || membersLoading}
          >
            Prev
          </button>
          <span className="muted">
            Page {memberPage} / {memberTotalPages}
          </span>
          <button
            type="button"
            className="button ghost"
            onClick={() => setMemberPage(Math.min(memberTotalPages, memberPage + 1))}
            disabled={memberPage >= memberTotalPages || membersLoading}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
