if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){
	loadEnabledCoins();
	var num=localStorage.getItem('num');
	if(!num) num=100;
	if(num>100) document.body.innerHTML+='<div id="loading">Loading...</div>';
	getData(()=>{
		processData();
		if(num>100) document.getElementById('loading').style.display='none';
		if(all_coins.length>0){
			var html='<div id="note">(From Top <select id="num">'; for(let i=100;i<=500;i+=50) html+='<option value="'+i+'"'+(num==i?' selected':'')+'>'+i; html+='</select> at <a target="_blank" href="https://coinmarketcap.com">CoinMarketCap</a>)</div>\n<div id="cols"></div>\n';
			document.body.innerHTML+=html;
			for(let i=0;i<all_coins.length;i++) document.getElementById('cols').innerHTML+='<input type="checkbox" id="'+all_coins[i][0]+'"'+(coins.indexOf(all_coins[i][0])!==-1?' checked':'')+'>'+all_coins[i][0]+(all_coins[i][2].toLowerCase()!==all_coins[i][0].toLowerCase()?' - '+all_coins[i][2]:'')+'<br>';
			document.body.innerHTML+='<div id="selects"><a id="unsel" href="javascript:;">Unselect All</a></div>';
		} else {
			document.body.innerHTML+='<div id="note">Error getting coins from API, this should be temporary</div>';
		}
		// update frequency
		var freq=localStorage.getItem('freq');
		if(!freq) freq=3;
		var html='<h2>Update Frequency</h2>Every <select id="freq">'; for(let i=1;i<=15;i++) html+='<option value="'+i+'"'+(freq==i?' selected':'')+'>'+i; html+='</select> minutes';
		document.body.innerHTML+=html;
		// badge colour
		var bcol=localStorage.getItem('bcol');
		if(!bcol || !/[a-f\d]{6}/i.test(bcol)) bcol=228822;
		document.body.innerHTML+='<h2>Badge Color</h2>#<input type="text" id="bcol" size="6" value="'+bcol+'"> <a target="_blank" href="https://htmlcolorcodes.com/color-chart/">Chart</a><br><br>';
		// events
		if(all_coins.length>0){
			document.getElementById('num').addEventListener('change',()=>{ saveNum(); });
			for(let i=0;i<all_coins.length;i++) document.getElementById(all_coins[i][0]).addEventListener('click',()=>{ saveCoins(); });
			document.getElementById('unsel').addEventListener('click',function(){ desel(); });
		}
		document.getElementById('freq').addEventListener('change',()=>{ saveFreq(); });
		document.getElementById('bcol').addEventListener('keyup',()=>{ changeBcol(); });
		document.getElementById('bcol').addEventListener('change',()=>{ changeBcol(); });
	});
}

function saveNum(){
	if(debug) console.log('saveNum()');
	localStorage.setItem('num',document.getElementById('num').value);
	location.reload();
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
