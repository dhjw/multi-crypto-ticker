var debug='', all_coins=[], coins=[];

// multi sync ajax https://stackoverflow.com/a/34570288
function requestsAreComplete(requests) {
    return requests.every(function (request) {
        return request.readyState == 4;
    });
}

function unsuccessfulRequests(requests) {
    var unsuccessful = requests.filter(function (request) {
         return request.status != 200;
    });
    return unsuccessful.length ? unsuccessful : null;
}

function onRequestsComplete(requests, callback) {
    function sharedCallback() {
        if (requestsAreComplete(requests)) {
            callback(requests, unsuccessfulRequests(requests));
        }
    }
    requests.forEach(function (request) {
        request.onreadystatechange = sharedCallback;
    });
}

function loadEnabledCoins(){
	coins=localStorage.getItem('enabled_coins');
	try { coins=JSON.parse(coins); } catch(e){}
	if(!coins || coins.length===0) coins=['BTC'];
	if(debug) console.log('coins=',coins);
}

function updateBadge(p){
	if(debug) console.log('updateBadge()');
	var t='';
	for(let i=0;i<coins.length;i++) if(p[coins[i]]) t+=coins[i].toUpperCase()+': '+p[coins[i]]+'\n';
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
	if(debug) console.log('getData()');
	var num=localStorage.getItem('num');
	if(!num) num=100;
	var pages=Math.round(num/100);
	if(debug) console.log('num='+num+' pages='+pages);
	var xs=[];
	for(let i=1;i<=pages;i++){
		if(i===pages && (i*100)-num>0) var limit=50; else var limit=100;
		var x=new XMLHttpRequest();
		x.timeout=15000;
		x.open('GET','https://api.coinmarketcap.com/v2/ticker/?start='+((i*100)-99)+'&limit='+limit);
		xs.push(x);
	}
	onRequestsComplete(xs,function(xr,xerr){
		for(let i=0;i<xs.length;i++){
			if(xs[i].status!==200){
				console.log('api error ['+i+'] xs=',xs);
				var t='Error, this should be temporary';
				if(xs[i].status===429) t+='\n(429) Rate limit exceeded';
				chrome.browserAction.setTitle({title:t});
				chrome.browserAction.setBadgeBackgroundColor({color:'#AA0000'});
				chrome.browserAction.setBadgeText({text:'!'});
				return;
			}
		}
		if(debug) console.log('xs=',xs);
		var r={data:{}}
		for(let i=0;i<xs.length;i++){
			try { var x=JSON.parse(xs[i].responseText); } catch(e){}
			if(!x) return;
			for(var j in x.data) r.data[j]=x.data[j];
		}
		if(debug) console.log('r=',r);
		var done=[]; all_coins=[];
		for(var i in r.data){
			if(done.indexOf(r.data[i].id)!==-1) continue;
			done.push(r.data[i].id);
			all_coins.push([r.data[i].symbol,parseFloat(r.data[i].quotes.USD.price),r.data[i].name]);
		}
		all_coins.sort(sort2D);
		return callback();
	});
	for(let i=0;i<xs.length;i++) xs[i].send();
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
	if(t.length<=3) var fs=74; else { t=t.substr(0,4); var fs=54; }
	ctx.font=fs+'px monospace';//sans-serif';
	ctx.textBaseline='top';
	ctx.textAlign='center';
	if(t.length<=3) ctx.fillText(t,64,0); else ctx.fillText(t,64,10);
	return ctx.getImageData(0,0,128,128);
}

// 2D array sort
function sort2D(a,b){
	if (a[0] === b[0]) return 0;
	else return (a[0] < b[0]) ? -1 : 1;
}