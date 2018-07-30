var debug='', all_coins=[], coins=[];

function loadEnabledCoins(){
	coins=localStorage.getItem('enabled_coins');
	try { coins=JSON.parse(coins); } catch(e){}
	if(!coins || coins.length===0) coins=['BTC'];
	if(debug) console.log('coins=',coins);
}

function updateBadge(p){
	if(debug) console.log('updateBadge()');
	var t='';
	for(let i=0;i<coins.length;i++) t+=coins[i].toUpperCase()+': '+p[coins[i]]+'\n';
	chrome.browserAction.setTitle({title:t});
	var bcol=localStorage.getItem('bcol');
	if(!bcol || !/[a-f\d]{6}/i.test(bcol)) bcol=228822;
	chrome.browserAction.setBadgeBackgroundColor({color:'#'+bcol});
	chrome.browserAction.setBadgeText({text:p.badge});
	chrome.browserAction.setIcon({imageData:makeIcon(p.current)});
}

function update(refresh){
	if(debug) console.log('update()');
	loadEnabledCoins();
	if(refresh) getData(()=>{ processData(); }); else processData();
}

function getData(callback){
	var x=new XMLHttpRequest();
	x.timeout=15000;
	x.open('GET','https://api.coinmarketcap.com/v2/ticker/');
	x.onreadystatechange=function(){
		if(x.readyState==4){
			if(x.status==200){
				if(debug) console.log('x=',x);
				try { var r=JSON.parse(x.responseText); } catch(e){}
				if(debug) console.log('r=',r);
				if(!r) return;
				all_coins=[];
				for(var i in r.data) all_coins.push([r.data[i].symbol,parseFloat(r.data[i].quotes.USD.price),r.data[i].name]);
				all_coins.sort(sort2D);
			} else {
				console.log('api error x=',x);
				var t='Error, this should be temporary';
				if(x.status===429) t+='\n(429) Rate limit exceeded';
				chrome.browserAction.setTitle({title:t});
				chrome.browserAction.setBadgeBackgroundColor({color:'#AA0000'});
				chrome.browserAction.setBadgeText({text:'!'});
			}
			return callback();
		}
	}
	x.send();
}

function processData(){
	if(debug) console.log('processData()');
	if(!all_coins) return;
	var p={};
	for(let i=0;i<all_coins.length;i++){
		var s=all_coins[i][0],a=all_coins[i][1],d='';
		if(coins.indexOf(s)!==-1){
			if(debug) console.log('found in coins');
			if(a<=0.99994){ // 4 decimals, no leading 0
				var d=5, b=+a.toFixed(4);
				b=b.toString().substr(1);
			} else if(a<=99.994){ // 2 decimals
				var b=a.toFixed(2);
			} else if(a<=999.94){ // 1 decimal
				var b=+a.toFixed(1);
			} else if(Math.round(a)<=9999){ // no decimals
				b=Math.round(a);
			} else if(a<=999400){ // 10k-999k, 0 or 1 decimal
				var b=a/1000;
				if(b<=99.94) b=+b.toFixed(1); else b=Math.round(b);
				b+='k';
			} else { // millions
				var b=a/1000000;
				if(b<=99.94) b=+b.toFixed(1); else b=Math.round(b);
				b+='M';
			}
			if(d) p[s]=+a.toFixed(d); else p[s]=a.toFixed(2); // title
			if(typeof b!=='string') b=b.toString();
			p[s+'b']=b; // badge
		}
	}
	var current=localStorage.getItem('current');
	current_i=coins.indexOf(current);
	if(current_i===-1){ current=coins[0]; localStorage.setItem('current',current); }
	if(debug) console.log('current=',current);
	p.badge=p[current+'b'];
	p.current=current;
	if(debug) console.log('p=',p);
	localStorage.setItem('response',JSON.stringify(p));
	updateBadge(p);
}

function makeIcon(t){
	if(debug) console.log('makeIcon t=',t);
	var img=document.createElement('canvas');
	img.width=128, img.height=128;
	var ctx=img.getContext('2d');
	if(t.length===3) var fs=74; else var fs=54;
	ctx.font=fs+'px monospace';//sans-serif';
	ctx.textBaseline='top';
	if(t.length===3) ctx.fillText(t,0,0); else ctx.fillText(t,0,10);
	return ctx.getImageData(0,0,128,128);
}

// 2D array sort
function sort2D(a,b){
	if (a[0] === b[0]) return 0;
	else return (a[0] < b[0]) ? -1 : 1;
}