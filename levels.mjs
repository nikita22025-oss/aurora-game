import {level} from './core.mjs';
export const levels=[
 {name:'Первый сигнал',text:'Перелейте одинаковые цвета вместе. Начните с первой колбы.',board:[[0,0,1,1],[1,1,0,0],[],[]]},
 {name:'Чистая частота',text:'Свободная колба поможет распутать слои.',board:[[0,1,0,1],[1,0,1,0],[],[]]},
 ...[4,6,8,10,12,14,16,20].map((seed,i)=>({name:['Аварийное питание','Тихое течение','Кислородный контур','Зелёный импульс','Глубинная проба','Прозрачная вода','Жизнь возвращается','Рассвет Авроры'][i],text:['Станции нужен первый заряд энергии.','Не спешите: смотрите на верхние цвета.','Соберите реагенты для оранжереи.','Каждая чистая колба приближает восстановление.','Больше цветов — больше возможностей.','Очистим воду за иллюминатором.','Океан ждёт вашего последнего шага.','Завершите восстановление станции.'][i],board:level(seed).board}))
];
export const upgrades=[{id:'power',name:'Вернуть свет',desc:'Запускаем генератор и освещаем станцию.',cost:3,icon:'ϟ',label:'Питание'},{id:'garden',name:'Посадить оранжерею',desc:'Первые растения и свежий кислород.',cost:3,icon:'♧',label:'Оранжерея'},{id:'ocean',name:'Оживить океан',desc:'Чистая вода возвращает рыб к станции.',cost:4,icon:'≈',label:'Океан'}];
export function reward(state,i,moves){const first=!state.done[i];state.done[i]=true;state.best[i]=Math.min(state.best[i]||Infinity,moves);if(first)state.energy++;return first;}
export function buy(state,i){const u=upgrades[i];if(state.upgrades.includes(u.id)||state.energy<u.cost||i>0&&!state.upgrades.includes(upgrades[i-1].id))return false;state.energy-=u.cost;state.upgrades.push(u.id);return true;}
