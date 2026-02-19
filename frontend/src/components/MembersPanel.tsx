import { useState, type SubmitEvent } from 'react';
import type { GroupMember } from '../types';

type MembersPanelProps = {
  memberStatus: string;
  membersError: string;
  membersLoading: boolean;
  members: GroupMember[];
  onAddMember: (email: string) => Promise<boolean> | boolean;
};

export function MembersPanel({
  memberStatus,
  membersError,
  membersLoading,
  members,
  onAddMember,
}: MembersPanelProps) {
  const [memberEmail, setMemberEmail] = useState('');

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!memberEmail.trim()) {
      return;
    }
    const ok = await onAddMember(memberEmail.trim());
    if (ok) {
      setMemberEmail('');
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
