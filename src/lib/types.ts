export type ID = string;
export type Priority = 'Low'|'Medium'|'High'|'Urgent';
export interface Label { id: ID; name: string; color: string }
export interface ChecklistItem { id: ID; text: string; done: boolean }
export interface Card { id: ID; boardId: ID; columnId: ID; title: string; description: string; priority: Priority; labelIds: ID[]; dueDate: string; checklist: ChecklistItem[]; createdAt: string; updatedAt: string }
export interface Column { id: ID; boardId: ID; title: string; cardIds: ID[]; wipLimit: number|null }
export interface Board { id: ID; title: string; description: string; columnIds: ID[]; labelIds: ID[]; createdAt: string; updatedAt: string; accent: string }
export interface Event { id: ID; cardId: ID; boardId: ID; type: 'created'|'moved'|'edited'|'completed'; message: string; at: string }
export interface DataState { boards: Record<ID,Board>; columns: Record<ID,Column>; cards: Record<ID,Card>; labels: Record<ID,Label>; activeBoardId: ID|null; events: Event[] }
export interface HistoryState { past: DataState[]; present: DataState; future: DataState[] }
