if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
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
	getData(()=>{
		if(!apikey){ alert('Invalid API key.'); return location.reload(); }
		processData();
		if(all_coins.length>0){
			var html='<h2>Enabled Coins</h2><div id="note">(From Top 100 at <a target="_blank" href="https://coinmarketcap.com">CoinMarketCap</a>)</div>\n<div id="cols"></div>\n';
			document.body.innerHTML+=html;
			for(let i=0;i<all_coins.length;i++) document.getElementById('cols').innerHTML+='<input type="checkbox" id="'+all_coins[i][0]+'"'+(coins.indexOf(all_coins[i][0])!==-1?' checked':'')+'>'+all_coins[i][0]+(all_coins[i][2].toLowerCase()!==all_coins[i][0].toLowerCase()?' - '+all_coins[i][2]:'')+'<br>';
			document.body.innerHTML+='<div id="selects"><a id="unsel" href="#">Unselect All</a></div>';
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
		if(all_coins.length>0){
			for(let i=0;i<all_coins.length;i++) document.getElementById(all_coins[i][0]).addEventListener('click',()=>{ saveCoins(); });
			document.getElementById('unsel').addEventListener('click',e=>{ e.preventDefault(); desel(); });
		}
		document.getElementById('freq').addEventListener('change',()=>{ saveFreq(); });
		document.getElementById('bcol').addEventListener('keyup',()=>{ changeBcol(); });
		document.getElementById('bcol').addEventListener('change',()=>{ changeBcol(); });
		document.getElementById('remkey').addEventListener('click',e=>{ e.preventDefault(); remKey(); });
	});
}

function desel(){
	for(let i=0;i<all_coins.length;i++) document.getElementById(all_coins[i][0]).checked=false;
	saveCoins();
}

function saveCoins(){
	if(debug) console.log('saveCoins()');
	var e=[];
	for(let i=0;i<all_coins.length;i++) if(document.getElementById(all_coins[i][0]).checked) e.push(all_coins[i][0]);
	if(debug) console.log('setting enabled_coins e=',e);
	localStorage.setItem('enabled_coins',JSON.stringify(e));
	update();
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
	localStorage.setItem('apikey',document.getElementById('apikey').value.trim());
	apikey=document.getElementById('apikey').value.trim();
	location.reload();
}

function remKey(){
	if(confirm('Are you sure you want to remove your API key?\nUpdates won\'t work until you add another.')){
		localStorage.removeItem('apikey');
		apikey='';
		location.reload();
	}
}