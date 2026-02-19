import type { SubmitEvent } from 'react';
import type { GroupMember } from '../types';

type MembersPanelProps = {
  memberEmail: string;
  memberStatus: string;
  membersError: string;
  membersLoading: boolean;
  members: GroupMember[];
  onMemberEmailChange: (value: string) => void;
  onAddMember: (event: SubmitEvent<HTMLFormElement>) => void;
};

export function MembersPanel({
  memberEmail,
  memberStatus,
  membersError,
  membersLoading,
  members,
  onMemberEmailChange,
  onAddMember,
}: MembersPanelProps) {
  return (
    <div className="members-card">
      <h2 className="subtitle">Members</h2>
      <form onSubmit={onAddMember} className="form inline">
        <label className="label">
          Email
          <input
            className="input"
            type="email"
            value={memberEmail}
            onChange={(event) => onMemberEmailChange(event.target.value)}
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
