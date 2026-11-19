export type ID = string;
export type Priority = 'Low'|'Medium'|'High'|'Urgent';
export type Label = {id:ID;name:string;color:string};
export type ChecklistItem = {id:ID;text:string;done:boolean};
export type Activity = {id:ID;type:'created'|'moved'|'edited';message:string;at:string};
export type Card = {id:ID;boardId:ID;columnId:ID;title:string;description:string;priority:Priority;labelIds:ID[];dueDate:string|null;checklist:ChecklistItem[];createdAt:string;updatedAt:string;activity:Activity[]};
export type Column = {id:ID;boardId:ID;title:string;cardIds:ID[];wipLimit:number|null};
export type Board = {id:ID;title:string;description:string;columnIds:ID[];labelIds:ID[];createdAt:string;updatedAt:string;cover:string};
export type State = {boards:Record<ID,Board>;columns:Record<ID,Column>;cards:Record<ID,Card>;labels:Record<ID,Label>;activeBoardId:ID|null;completionEvents:{date:string;cardId:string}[]};
export type Action =
 | {type:'BOARD_ADD';board:Board;columns:Column[];cards?:Card[];labels?:Label[]}
 | {type:'BOARD_EDIT';id:ID;patch:Partial<Board>}
 | {type:'BOARD_DELETE';id:ID}
 | {type:'BOARD_ACTIVE';id:ID}
 | {type:'COLUMN_ADD';column:Column}
 | {type:'COLUMN_EDIT';id:ID;patch:Partial<Column>}
 | {type:'COLUMN_DELETE';id:ID}
 | {type:'CARD_ADD';card:Card}
 | {type:'CARD_EDIT';id:ID;patch:Partial<Card>}
 | {type:'CARD_DELETE';id:ID}
 | {type:'CARD_MOVE';id:ID;toColumn:ID;toIndex:number}
 | {type:'LABEL_ADD';label:Label}
 | {type:'LABEL_EDIT';id:ID;patch:Partial<Label>}
 | {type:'LABEL_DELETE';id:ID}
 | {type:'CHECK_TOGGLE';cardId:ID;itemId:ID};
export const uid=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const now=()=>new Date().toISOString();
export const emptyState:State={boards:{},columns:{},cards:{},labels:{},activeBoardId:null,completionEvents:[]};
export function reducer(s:State,a:Action):State{
 const stamp=now();
 switch(a.type){
 case 'BOARD_ADD': {const boards={...s.boards,[a.board.id]:a.board},columns={...s.columns},cards={...s.cards},labels={...s.labels};a.columns.forEach(x=>columns[x.id]=x);(a.cards||[]).forEach(x=>cards[x.id]=x);(a.labels||[]).forEach(x=>labels[x.id]=x);return {...s,boards,columns,cards,labels,activeBoardId:a.board.id};}
 case 'BOARD_EDIT':return s.boards[a.id]?{...s,boards:{...s.boards,[a.id]:{...s.boards[a.id],...a.patch,id:a.id,updatedAt:stamp}}}:s;
 case 'BOARD_ACTIVE':return s.boards[a.id]?{...s,activeBoardId:a.id}:s;
 case 'BOARD_DELETE':{const b=s.boards[a.id];if(!b)return s;const boards={...s.boards},columns={...s.columns},cards={...s.cards};delete boards[a.id];b.columnIds.forEach(cid=>{const c=columns[cid];if(c)c.cardIds.forEach(id=>delete cards[id]);delete columns[cid];});const ids=Object.keys(boards);return {...s,boards,columns,cards,activeBoardId:s.activeBoardId===a.id?(ids[0]||null):s.activeBoardId};}
 case 'COLUMN_ADD':{const c=a.column,b=s.boards[c.boardId];if(!b||s.columns[c.id])return s;return {...s,columns:{...s.columns,[c.id]:c},boards:{...s.boards,[b.id]:{...b,columnIds:[...b.columnIds,c.id],updatedAt:stamp}}};}
 case 'COLUMN_EDIT':return s.columns[a.id]?{...s,columns:{...s.columns,[a.id]:{...s.columns[a.id],...a.patch,id:a.id,boardId:s.columns[a.id].boardId}}}:s;
 case 'COLUMN_DELETE':{const c=s.columns[a.id];if(!c)return s;const columns={...s.columns},cards={...s.cards};delete columns[a.id];c.cardIds.forEach(id=>delete cards[id]);const b=s.boards[c.boardId];return {...s,columns,cards,boards:b?{...s.boards,[b.id]:{...b,columnIds:b.columnIds.filter(x=>x!==a.id)}}:s.boards};}
 case 'CARD_ADD':{const c=s.columns[a.card.columnId];if(!c||c.boardId!==a.card.boardId||s.cards[a.card.id])return s;return {...s,cards:{...s.cards,[a.card.id]:a.card},columns:{...s.columns,[c.id]:{...c,cardIds:[...c.cardIds,a.card.id]}}};}
 case 'CARD_EDIT':{const c=s.cards[a.id];if(!c)return s;const next={...c,...a.patch,id:c.id,boardId:c.boardId,columnId:c.columnId,updatedAt:stamp,activity:[...c.activity,{id:uid(),type:'edited' as const,message:'Task details updated',at:stamp}]};return {...s,cards:{...s.cards,[a.id]:next}};}
 case 'CARD_DELETE':{const c=s.cards[a.id];if(!c)return s;const cards={...s.cards};delete cards[a.id];const col=s.columns[c.columnId];return {...s,cards,columns:col?{...s.columns,[col.id]:{...col,cardIds:col.cardIds.filter(x=>x!==a.id)}}:s.columns};}
 case 'CARD_MOVE':{const card=s.cards[a.id],target=s.columns[a.toColumn];if(!card||!target||target.boardId!==card.boardId)return s;const source=s.columns[card.columnId];if(!source)return s;const sourceIds=source.cardIds.filter(x=>x!==card.id),same=source.id===target.id;const targetIds=same?sourceIds:[...target.cardIds];const index=Math.max(0,Math.min(a.toIndex,targetIds.length));targetIds.splice(index,0,card.id);const activity=[...card.activity,{id:uid(),type:'moved' as const,message:`Moved to ${target.title}`,at:stamp}];const cards={...s.cards,[card.id]:{...card,columnId:target.id,updatedAt:stamp,activity}};const columns={...s.columns,[source.id]:{...source,cardIds:same?targetIds:sourceIds}};if(!same)columns[target.id]={...target,cardIds:targetIds};return {...s,cards,columns};}
 case 'LABEL_ADD':return s.labels[a.label.id]?s:{...s,labels:{...s.labels,[a.label.id]:a.label}};
 case 'LABEL_EDIT':return s.labels[a.id]?{...s,labels:{...s.labels,[a.id]:{...s.labels[a.id],...a.patch,id:a.id}}}:s;
 case 'LABEL_DELETE':{const labels={...s.labels};delete labels[a.id];const cards={...s.cards};Object.values(cards).forEach(c=>{c.labelIds=c.labelIds.filter(id=>id!==a.id)});return {...s,labels,cards};}
 case 'CHECK_TOGGLE':{const c=s.cards[a.cardId];if(!c)return s;return {...s,cards:{...s.cards,[c.id]:{...c,updatedAt:stamp,checklist:c.checklist.map(x=>x.id===a.itemId?{...x,done:!x.done}:x)}}};}
 }
}
export type History={past:State[];present:State;future:State[]};
export const historyInit=(present:State):History=>({past:[],present,future:[]});
export function historyReducer(h:History,a:Action|{type:'UNDO'}|{type:'REDO'}):History{if(a.type==='UNDO'){if(!h.past.length)return h;return {past:h.past.slice(0,-1),present:h.past[h.past.length-1],future:[h.present,...h.future]};}if(a.type==='REDO'){if(!h.future.length)return h;return {past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)};}const next=reducer(h.present,a);if(next===h.present)return h;return {past:[...h.past.slice(-49),h.present],present:next,future:[]};}
export function dueStatus(date:string|null):'overdue'|'today'|'this week'|'upcoming'|'none'{if(!date)return 'none';const d=new Date(date+'T23:59:59'),today=new Date();today.setHours(0,0,0,0);const diff=Math.ceil((d.getTime()-today.getTime())/86400000);return diff<0?'overdue':diff===0?'today':diff<=7?'this week':'upcoming';}
