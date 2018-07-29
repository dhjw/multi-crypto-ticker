if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterDOMLoaded); else afterDOMLoaded();
function afterDOMLoaded(){
	loadEnabledCoins();
	getData(()=>{
		if(all_coins.length>0){
			document.body.innerHTML+='<div id="note">(From Top 100 at <a target="_blank" href="https://coinmarketcap.com">CoinMarketCap</a>)</div>\n<div id="cols"></div>\n';
			for(let i=0;i<all_coins.length;i++) document.getElementById('cols').innerHTML+='<input type="checkbox" id="'+all_coins[i][0]+'"'+(coins.indexOf(all_coins[i][0])!==-1?' checked':'')+'>'+all_coins[i][0]+(all_coins[i][2].toLowerCase()!==all_coins[i][0].toLowerCase()?' - '+all_coins[i][2]:'')+'<br>';
			// for(let i=0;i<all_coins.length;i++) document.getElementById('cols').innerHTML+='<input type="checkbox" id="'+all_coins[i][0]+'"'+(coins.indexOf(all_coins[i][0])!==-1?' checked':'')+'>'+all_coins[i][0]+' - '+all_coins[i][2]+'<br>';
			document.body.innerHTML+='<div id="selects"><a id="unsel" href="javascript:;">Unselect All</a></div>';
			// document.body.innerHTML+='<button id="r_btn">Refresh ticker</button>';
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
		document.body.innerHTML+='<h2>Badge Color</h2>#<input type="text" id="bcol" size="6" value="'+bcol+'"><!--<button id="bc_btn">Set</button>--> <a target="_blank" href="https://htmlcolorcodes.com/color-chart/">Chart</a><br><br>';
		// events
		if(all_coins.length>0){
			for(let i=0;i<all_coins.length;i++) document.getElementById(all_coins[i][0]).addEventListener('click',()=>{ saveCoins(); });
			document.getElementById('unsel').addEventListener('click',function(){ desel(); });
		}
		// document.getElementById('r_btn').addEventListener('click',()=>{ update(); });
		document.getElementById('freq').addEventListener('change',()=>{ saveFreq(); });
		document.getElementById('bcol').addEventListener('keyup',()=>{ changeBcol(); });
		document.getElementById('bcol').addEventListener('change',()=>{ changeBcol(); });
		// document.getElementById('bc_btn').addEventListener('click',()=>{ saveBcol(); });
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

function saveBcol(){
	var bcol=document.getElementById('bcol').value.replace('#','').trim();
	if(!bcol || !/[a-f\d]{6}/i.test(bcol)){
		bcol='228822';
		document.getElementById('bcol').style.background='pink';
		document.getElementById('bcol').focus();
	} else {
		document.getElementById('bcol').style.background='none';
		document.getElementById('bcol').value=bcol;
		chrome.browserAction.setBadgeBackgroundColor({color:'#'+bcol});
	}
	localStorage.setItem('bcol',bcol);
}

function changeBcol(){
	if(debug) console.log('changeBcol()');
	var bcol=document.getElementById('bcol').value.replace('#','').trim();
	if(!bcol || !/[a-f\d]{6}/i.test(bcol)) bcol='228822';
	chrome.browserAction.setBadgeBackgroundColor({color:'#'+bcol});
	saveBcol();
}