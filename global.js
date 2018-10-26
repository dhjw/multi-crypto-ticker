var debug='', apikey, all_coins=[], coins=[];

BigNumber.config({ ROUNDING_MODE:1 });

function cmpVersions(a,b){ // https://stackoverflow.com/a/16187766
	var i,diff;
	var regExStrip0=/(\.0+)+$/;
	var segmentsA=a.replace(regExStrip0,'').split('.');
	var segmentsB=b.replace(regExStrip0,'').split('.');
	var l=Math.min(segmentsA.length,segmentsB.length);
	for (i=0;i<l;i++){
		diff=parseInt(segmentsA[i],10)-parseInt(segmentsB[i],10);
		if(diff) return diff;
	}
	return segmentsA.length-segmentsB.length;
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
	apikey=localStorage.getItem('apikey');
	if(!apikey) return needKeyBadge();
	loadEnabledCoins();
	if(refresh) getData(()=>{ processData(); }); else processData();
}

function getData(callback){
	if(debug) console.log('getData()');
	var x=new XMLHttpRequest();
	x.timeout=15000;
	x.open('GET','https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?CMC_PRO_API_KEY='+apikey);
	x.onreadystatechange=function(){
		if(this.readyState==4){
			if(this.status==200){
				if(debug) console.log('x=',x);
				var r={data:{}}
				try { var y=JSON.parse(x.responseText); } catch(e){}
				if(!y) return;
				for(var j in y.data) r.data[j]=y.data[j];
				if(debug) console.log('r=',r);
				var done=[]; all_coins=[];
				for(var i in r.data){
					if(done.indexOf(r.data[i].id)!==-1) continue;
					done.push(r.data[i].id);
					all_coins.push([r.data[i].symbol,parseFloat(r.data[i].quote.USD.price),r.data[i].name]);
				}
				all_coins.sort(sort2D);
				return callback();
			} else if(this.status==401){ // invalid key
				localStorage.removeItem('apikey');
				apikey='';
				needKeyBadge();
				return callback();
			} else {
				console.log('api error ['+i+'] x=',x);
				chrome.browserAction.setTitle({title:'API error, this should be temporary'});
				chrome.browserAction.setBadgeBackgroundColor({color:'#AA0000'});
				chrome.browserAction.setBadgeText({text:'!'});
				return;
			}
		}
	}
	x.send();
}

function processData(){
	if(debug) console.log('processData()');
	if(!all_coins) return;
	var p={};
	for(let i=0;i<all_coins.length;i++){
		var s=all_coins[i][0],a=BigNumber(all_coins[i][1]),d='';
		if(coins.indexOf(s)!==-1){
			if(debug) console.log('found in coins');
			// linux 5 char badge
			if(navigator.platform.indexOf('Linux')!=-1){
				if(a.toFixed(4)<=0.9999){ // 4 decimals, no leading or trailing 0
					var d=5, b=+a.toFixed(4);
					b=b.toString().substr(1);
				} else if(a.toFixed(2)<=99.99){ // 2 decimals
					var b=a.toFixed(2);
				} else if(a.toFixed(1)<=999.9){ // 1 decimal
					var b=+a.toFixed(1);
				} else if(a.toFixed(0)<=9999){ // no decimals
					var b=a.toFixed(0);
				} else if(a.toFixed(0)<=999999){ // 10k-999k, 0 or 1 decimal
					var b=a.div(1000);
					if(BigNumber(b).toFixed(1)<=99.9) b=+BigNumber(b).toFixed(1); else b=BigNumber(b).toFixed(0);
					b+='k';
				} else { // millions
					var b=a.div(1000000);
					if(BigNumber(b).toFixed(1)<=9.9) b=+BigNumber(b).toFixed(1); else b=BigNumber(b).toFixed(0); // 5 chars cuts off
					b+='m';
				}
			// windows & mac 4 char badge
			} else {
 				if(a.toFixed(3)<=0.999){ // 3 decimals, no leading or trailing 0
					var d=5, b=+a.toFixed(3);
					b=b.toString().substr(1);
				} else if(a.toFixed(2)<=9.99){ // 2 decimals
					var b=a.toFixed(2);
				} else if(a.toFixed(1)<=99.9){ // 1 decimal
					var b=a.toFixed(1);
				} else if(a.toFixed(0)<=9999){ // no decimals
					var b=a.toFixed(0);
				} else if(a.toFixed(0)<=999999){ // 10k-999k, no decimal
					var b=a.div(1000).toFixed(0)+'k';
				} else { // millions
					var b=a.div(1000000);
					if(BigNumber(b).toFixed(1)<=9.9) b=+BigNumber(b).toFixed(1); else b=BigNumber(b).toFixed(0);
					b+='M';
				}
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

function needKeyBadge(){
	if(debug) console.log('no api key');
	chrome.browserAction.setIcon({path:'img/default.png'});
	chrome.browserAction.setTitle({title:'API Key required. Click to open Options.'});
	chrome.browserAction.setBadgeBackgroundColor({color:'#AA0000'});
	chrome.browserAction.setBadgeText({text:'!'});
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