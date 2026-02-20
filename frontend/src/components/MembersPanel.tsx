import { useEffect, useState, type SubmitEvent } from 'react';
import { useBalancesAndSettle } from '../contexts/BalancesAndSettleContext';
import { useGroups } from '../contexts/GroupContext';
import { useMembers } from '../contexts/MemberContext';

export function MembersPanel() {
  const { activeGroupId } = useGroups();
  const { membersError, membersLoading, members, fetchMembers, addMember } = useMembers();
  const { fetchBalancesAndSettle } = useBalancesAndSettle();
  const [memberEmail, setMemberEmail] = useState('');
  const [memberStatus, setMemberStatus] = useState('');

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }
    void fetchMembers(activeGroupId).catch(() => {});
  }, [activeGroupId, fetchMembers]);

  if (!activeGroupId) {
    return null;
  }

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
            {members.map((member) => (
              <li key={member.id}>
                <span className="member-email">{member.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
