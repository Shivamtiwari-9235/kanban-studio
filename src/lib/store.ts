import {DataState,HistoryState,Card,Board,Column,Label,ID} from './types';
export type Action=
 |{type:'HYDRATE';state:DataState}|{type:'ADD_BOARD';board:Board}|{type:'UPDATE_BOARD';id:ID;patch:Partial<Board>}|{type:'DELETE_BOARD';id:ID}|{type:'ADD_COLUMN';column:Column}|{type:'UPDATE_COLUMN';id:ID;patch:Partial<Column>}|{type:'DELETE_COLUMN';id:ID}|{type:'ADD_CARD';card:Card}|{type:'UPDATE_CARD';id:ID;patch:Partial<Card>}|{type:'DELETE_CARD';id:ID}|{type:'MOVE_CARD';id:ID;columnId:ID;index:number}|{type:'ADD_LABEL';label:Label}|{type:'DELETE_LABEL';id:ID}|{type:'ACTIVE_BOARD';id:ID}|{type:'UNDO'}|{type:'REDO'}|{type:'IMPORT';state:DataState};
const stamp=()=>new Date().toISOString();
const normalizeDataState=(state:DataState):DataState=>({...state,boards:Object.fromEntries(Object.values(state.boards).map(board=>[board.id,{...board,columnIds:[...new Set(board.columnIds)]}])),columns:Object.fromEntries(Object.values(state.columns).map(column=>[column.id,{...column,cardIds:[...new Set(column.cardIds)]}]))});
function reduce(s:DataState,a:Action):DataState{
 switch(a.type){case'HYDRATE':case'IMPORT':return normalizeDataState(a.state);
 case'ACTIVE_BOARD':return {...s,activeBoardId:a.id};
 case'ADD_BOARD':return {...s,boards:{...s.boards,[a.board.id]:a.board},activeBoardId:a.board.id};
 case'UPDATE_BOARD':{const b=s.boards[a.id];return b?{...s,boards:{...s.boards,[a.id]:{...b,...a.patch,id:b.id,updatedAt:stamp()}}}:s}
 case'DELETE_BOARD':{const b=s.boards[a.id];if(!b)return s;const columns={...s.columns},cards={...s.cards};b.columnIds.forEach(cid=>{columns[cid]?.cardIds.forEach(tid=>delete cards[tid]);delete columns[cid]});const boards={...s.boards};delete boards[a.id];return {...s,boards,columns,cards,activeBoardId:s.activeBoardId===a.id?(Object.keys(boards)[0]??null):s.activeBoardId}}
 case'ADD_COLUMN':{const c=a.column,b=s.boards[c.boardId];if(!b||s.columns[c.id])return s;return {...s,columns:{...s.columns,[c.id]:c},boards:{...s.boards,[b.id]:{...b,columnIds:[...b.columnIds,c.id]}}}}
 case'UPDATE_COLUMN':{const c=s.columns[a.id];return c?{...s,columns:{...s.columns,[a.id]:{...c,...a.patch,id:c.id,boardId:c.boardId}}}:s}
 case'DELETE_COLUMN':{const c=s.columns[a.id];if(!c)return s;const columns={...s.columns},cards={...s.cards};delete columns[a.id];c.cardIds.forEach(id=>delete cards[id]);const b=s.boards[c.boardId];return {...s,columns,cards,boards:b?{...s.boards,[b.id]:{...b,columnIds:b.columnIds.filter(x=>x!==a.id)}}:s.boards}}
 case'ADD_CARD':{const c=s.columns[a.card.columnId];if(!c||s.cards[a.card.id]||c.boardId!==a.card.boardId)return s;return {...s,cards:{...s.cards,[a.card.id]:a.card},columns:{...s.columns,[c.id]:{...c,cardIds:[...c.cardIds,a.card.id]}}}}
 case'UPDATE_CARD':{const c=s.cards[a.id];return c?{...s,cards:{...s.cards,[a.id]:{...c,...a.patch,id:c.id,boardId:c.boardId,updatedAt:stamp()}}}:s}
 case'DELETE_CARD':{const c=s.cards[a.id];if(!c)return s;const cards={...s.cards},col=s.columns[c.columnId];delete cards[a.id];return {...s,cards,columns:col?{...s.columns,[col.id]:{...col,cardIds:col.cardIds.filter(x=>x!==a.id)}}:s.columns}}
 case'MOVE_CARD':{const card=s.cards[a.id],target=s.columns[a.columnId],source=card&&s.columns[card.columnId];if(!card||!target||!source||target.boardId!==card.boardId)return s;const from=source.cardIds.filter(x=>x!==a.id),to=source.id===target.id?from:[...target.cardIds];to.splice(Math.max(0,Math.min(a.index,to.length)),0,a.id);return {...s,columns:{...s.columns,[source.id]:{...source,cardIds:source.id===target.id?to:from},...(source.id===target.id?{}:{[target.id]:{...target,cardIds:to}})},cards:{...s.cards,[a.id]:{...card,columnId:target.id,updatedAt:stamp()}},events:[{id:crypto.randomUUID(),cardId:a.id,boardId:card.boardId,type:'moved',message:`Moved ${card.title}`,at:stamp()},...s.events].slice(0,300)}}
 case'ADD_LABEL':return {...s,labels:{...s.labels,[a.label.id]:a.label}};
 case'DELETE_LABEL':{const labels={...s.labels};delete labels[a.id];const cards={...s.cards};Object.values(cards).forEach(c=>{c.labelIds=c.labelIds.filter(x=>x!==a.id)});return {...s,labels,cards}}
 default:return s;
 }
}
export function historyReducer(h:HistoryState,a:Action):HistoryState{if(a.type==='UNDO'){if(!h.past.length)return h;const previous=h.past[h.past.length-1];return {past:h.past.slice(0,-1),present:previous,future:[h.present,...h.future]}}if(a.type==='REDO'){if(!h.future.length)return h;const next=h.future[0];return {past:[...h.past,h.present].slice(-80),present:next,future:h.future.slice(1)}}const next=reduce(h.present,a);if(next===h.present)return h;if(a.type==='ACTIVE_BOARD'||a.type==='HYDRATE')return {...h,present:next};return {past:[...h.past,h.present].slice(-80),present:next,future:[]}}
export const createHistory=(state:DataState):HistoryState=>({past:[],present:state,future:[]});
