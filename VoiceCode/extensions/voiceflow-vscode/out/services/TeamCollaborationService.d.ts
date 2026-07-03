/**
 * Team Collaboration Service (ENTERPRISE TIER)
 * Enables team sharing and collaboration features
 */
export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
}
export interface SharedItem {
    id: string;
    type: 'command' | 'template' | 'workflow';
    name: string;
    sharedBy: string;
    sharedAt: Date;
}
export declare class TeamCollaborationService {
    /**
     * Get team members
     */
    getTeamMembers(): Promise<TeamMember[]>;
    /**
     * Share current file with team
     */
    shareCurrentFile(): Promise<void>;
    /**
     * Get shared items
     */
    getSharedItems(): Promise<SharedItem[]>;
    /**
     * Invite team member
     */
    inviteMember(): Promise<void>;
}
//# sourceMappingURL=TeamCollaborationService.d.ts.map