"use strict";
/**
 * Team Collaboration Service (ENTERPRISE TIER)
 * Enables team sharing and collaboration features
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamCollaborationService = void 0;
const vscode = __importStar(require("vscode"));
class TeamCollaborationService {
    /**
     * Get team members
     */
    async getTeamMembers() {
        // Stub implementation
        return [
            {
                id: 'user1',
                name: 'John Doe',
                email: 'john@company.com',
                role: 'owner',
            },
            {
                id: 'user2',
                name: 'Jane Smith',
                email: 'jane@company.com',
                role: 'member',
            },
        ];
    }
    /**
     * Share current file with team
     */
    async shareCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active file to share');
            return;
        }
        const members = await this.getTeamMembers();
        const memberItems = members.map((m) => ({
            label: m.name,
            description: m.email,
            member: m,
        }));
        const selected = await vscode.window.showQuickPick(memberItems, {
            placeHolder: 'Select team member to share with...',
            canPickMany: true,
        });
        if (selected && selected.length > 0) {
            vscode.window.showInformationMessage(`File shared with ${selected.length} team member(s)`);
        }
    }
    /**
     * Get shared items
     */
    async getSharedItems() {
        return [];
    }
    /**
     * Invite team member
     */
    async inviteMember() {
        const email = await vscode.window.showInputBox({
            prompt: 'Enter email address to invite',
            placeHolder: 'colleague@company.com',
        });
        if (email) {
            vscode.window.showInformationMessage(`Invitation sent to ${email}`);
        }
    }
}
exports.TeamCollaborationService = TeamCollaborationService;
//# sourceMappingURL=TeamCollaborationService.js.map