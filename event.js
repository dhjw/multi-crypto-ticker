
chrome.runtime.onInstalled.addListener(function(details){
	if(cmpVersions(details.previousVersion,'1.0.9')<0){
		var freq=localStorage.getItem('freq');
		if(!freq || freq<5) localStorage.setItem('freq',5);
	}
	update(1);
});

chrome.runtime.onStartup.addListener(function(details){
	update(1);
});

chrome.alarms.get('update',a=>{
	if(debug) console.log('alarm update a=',a);
	var freq=localStorage.getItem('freq');
	if(!freq || freq<5) freq=5;
	if(!a || (a && a.periodInMinutes!=freq)){
		if(debug) console.log('alarm not set or period != '+freq+', setting');
		chrome.alarms.clear('update');
		chrome.alarms.create('update',{periodInMinutes:parseInt(freq)});
		if(debug) setTimeout(()=>{ chrome.alarms.getAll(function(a){ console.log('alarms='); console.log(a); }); },1000);
	}
});

chrome.alarms.onAlarm.addListener(()=>{
	update(1);
});

chrome.contextMenus.removeAll(); // max 6
chrome.contextMenus.create({ id: 'cmc', title: 'CoinMarketCap', contexts: ['browser_action'] });
chrome.contextMenus.create({ id: 'lcw', title: 'LiveCoinWatch', contexts: ['browser_action'] });

chrome.contextMenus.onClicked.addListener((info,tab)=>{
	if(debug) console.log('info=',info,'tab=',tab);
	switch(info.menuItemId){
		case 'cmc': window.open('https://coinmarketcap.com'); break;
		case 'lcw': window.open('https://www.livecoinwatch.com'); break;
	}
});

// listen
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
	if(message.pollFresh) sendResponse(fresh);
});

// on icon click set next coin as current and update badge with stored data
chrome.browserAction.onClicked.addListener(()=>{
	if(debug) console.log('clicked');
	apikey=localStorage.getItem('apikey');
	if(!apikey){
		needKeyBadge();
		chrome.runtime.openOptionsPage(()=>{
			for(let i=0;i<chrome.extension.getViews().length;i++){
				if(chrome.extension.getViews()[i].location.href.indexOf('options.html')!==-1){
					chrome.extension.getViews()[i].location.reload();
				}
			}
		});
		return;
	}
	loadEnabledCoins();
	var current=localStorage.getItem('current');
	current_i=coins.indexOf(current);
	if(current_i===-1||current_i>=coins.length-1) current_i=0; else current_i++;
	current=coins[current_i];
	localStorage.setItem('current',current);
	try { var p=JSON.parse(localStorage.getItem('response')); } catch(e){ p={}; }
	if(debug) console.log('p=',p);
	if(!p) for(let i=0;i<coins.length;i++){ p[coins[i]]='0'; p[coins[i]+'b']='0'; }
	p.badge=p[current+'b'];
	p.current=current;
	updateBadge(p);
});
