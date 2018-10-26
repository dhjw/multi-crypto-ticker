if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
var tmp_coins;
function afterDOMLoaded(){
	apikey=localStorage.getItem('apikey');
	if(!apikey){
		needKeyBadge();
		document.body.innerHTML+='<h2>API Key</h2>Get a free API key from CoinMarketCap <a target="_blank" href="https://pro.coinmarketcap.com/">here</a> and enter it below:<br><input type="text" id="apikey" size="32"> <input type="button" id="savekey" value="Save"><br>';
		document.getElementById('apikey').focus();
		document.getElementById('savekey').addEventListener('click',()=>{ saveKey(); });
		window.addEventListener('focus',function(){
			document.getElementById('apikey').focus();
		});
		return;
	}
	loadEnabledCoins();
	var num=localStorage.getItem('num');
	if(!num) num=100;
	var all_coins=JSON.parse(localStorage.getItem('allCoins'));
	tmp_coins=all_coins.slice(0,num);
	if(debug) console.log('tmp_coins=',tmp_coins);
	tmp_coins.sort(sort2D);
	if(tmp_coins.length>0){
		var html='<h2>Enabled Coins</h2><div id="note">(From Top <select id="num">'; for(let i=100;i<=1000;i+=100) html+='<option value="'+i+'"'+(num==i?' selected':'')+'>'+i; html+='</select> at <a target="_blank" href="https://coinmarketcap.com">CoinMarketCap</a>)</div>\n<div id="cols">';
		for(let i=0;i<num;i++) html+='<input type="checkbox" id="'+tmp_coins[i][0]+'"'+(coins.indexOf(tmp_coins[i][0])!==-1?' checked':'')+'>'+tmp_coins[i][0]+(tmp_coins[i][2].toLowerCase()!==tmp_coins[i][0].toLowerCase()?' - '+tmp_coins[i][2]:'')+'<br>';
		html+='</div>\n<div id="selects"><a id="unsel" href="#">Unselect All</a></div>';
		document.body.innerHTML+=html;
	} else {
		document.body.innerHTML+='<div id="note">Error getting coins from API, this should be temporary</div>';
	}
	// update frequency
	var freq=localStorage.getItem('freq');
	if(!freq) freq=3;
	var html='<h2>Update Frequency</h2>Every <select id="freq">'; for(let i=5;i<=15;i++) html+='<option value="'+i+'"'+(freq==i?' selected':'')+'>'+i; html+='</select> minutes';
	document.body.innerHTML+=html;
	// badge colour
	var bcol=localStorage.getItem('bcol');
	if(!bcol || !/[a-f\d]{6}/i.test(bcol)) bcol=228822;
	document.body.innerHTML+='<h2>Badge Color</h2>#<input type="text" id="bcol" size="6" value="'+bcol+'"> <a target="_blank" href="https://htmlcolorcodes.com/color-chart/">Chart</a><br><br>';
	document.body.innerHTML+='<a id="remkey" class="r" href="#">Remove API Key</a><br>';
	// events
	if(tmp_coins.length>0){
		document.getElementById('num').addEventListener('change',()=>{ saveNum(); });
		for(let i=0;i<num;i++) document.getElementById(tmp_coins[i][0]).addEventListener('click',()=>{ saveCoins(); });
		document.getElementById('unsel').addEventListener('click',e=>{ e.preventDefault(); desel(); });
	}
	document.getElementById('freq').addEventListener('change',()=>{ saveFreq(); });
	document.getElementById('bcol').addEventListener('keyup',()=>{ changeBcol(); });
	document.getElementById('bcol').addEventListener('change',()=>{ changeBcol(); });
	document.getElementById('remkey').addEventListener('click',e=>{ e.preventDefault(); remKey(); });
}

function saveNum(){
	if(debug) console.log('saveNum()');
	localStorage.setItem('num',document.getElementById('num').value);
	location.reload();
}

function desel(){
	for(let i=0;i<tmp_coins.length;i++) document.getElementById(tmp_coins[i][0]).checked=false;
	stars=[];
	saveCoins();
}

function saveCoins(){
	chrome.runtime.sendMessage({pollFresh:1},r=>{
		fresh=r;
		if(debug) console.log('saveCoins() fresh=',fresh);
		var e=[];
		for(let i=0;i<tmp_coins.length;i++){
			if(document.getElementById(tmp_coins[i][0]).checked){
				e.push(tmp_coins[i][0]);
				if(coins.indexOf(tmp_coins[i][0])==-1 && fresh.indexOf(tmp_coins[i][0])==-1 && fresh!='all') stars.push(tmp_coins[i][0]);
			} else {
				if(stars.indexOf(tmp_coins[i][0])!==-1){
					stars.splice(stars.indexOf(tmp_coins[i][0]),1);
				}
			}
		}
		chrome.runtime.sendMessage({stars:stars});
		if(debug) console.log('setting enabled_coins e=',e);
		localStorage.setItem('enabled_coins',JSON.stringify(e));
		update();
	});

}

function saveFreq(){
	if(debug) console.log('saveFreq()');
	localStorage.setItem('freq',document.getElementById('freq').value);
}

function changeBcol(){
	if(debug) console.log('changeBcol()');
	var bcol=document.getElementById('bcol').value.replace('#','').trim();
	if(!bcol || !/[a-f\d]{6}/i.test(bcol)){
		bcol='228822';
		document.getElementById('bcol').style.background='pink';
	} else {
		document.getElementById('bcol').style.background='none';
		document.getElementById('bcol').value=bcol;
	}
	chrome.browserAction.setBadgeBackgroundColor({color:'#'+bcol});
	localStorage.setItem('bcol',bcol);
}

function saveKey(){
	apikey=document.getElementById('apikey').value.trim();
	if(!apikey){
		document.getElementById('apikey').value='';
		document.getElementById('apikey').focus();
		return;
	}
	localStorage.setItem('apikey',apikey);
	loadEnabledCoins();
	getAllCoins(a=>{
		if(a=='updated'){ processData(); location.reload(); }
		else if(a=='invalidkey'){ alert('Invalid API key.'); document.getElementById('apikey').value=''; document.getElementById('apikey').focus(); return; }
		else getQuotes(a=>{
			if(a=='invalidkey'){ alert('Invalid API key.'); document.getElementById('apikey').value=''; document.getElementById('apikey').focus(); return; }
			processData();
			location.reload();
		});
		
	});
}

function remKey(){
	if(confirm('Are you sure you want to remove your API key?\nUpdates won\'t work until you add another.')){
		localStorage.removeItem('apikey');
		apikey='';
		location.reload();
	}
}

// listen
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
	if(debug) console.log('got message=',message);
	if(message.stars) stars=message.stars;
	if(message.fresh) fresh=message.fresh;
});