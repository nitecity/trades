const container1 = document.getElementById('container1');
const container2 = document.getElementById('container2');
const markPrice = document.getElementById('markPrice');
const oi = document.getElementById('oi');
const topsStatus = document.getElementById('tops-status');
const pause = document.getElementById('pause');
const temp = document.getElementById('temp');
const alarmSound = document.getElementById('alarmSound');
const alarmEmoji = document.getElementById("alarmEmoji");
const alarmSound1 = document.getElementById("alarmSound1");
const alarmEmoji1 = document.getElementById("alarmEmoji1");


let isPaused = false;
let intervalId = null;
let alarm = false;
let alarm1 = false;

setTimeout( () => {
    temp.classList.add('temp');
    temp.remove();
}, 10000);

container1.addEventListener('click', () => {
    container1.classList.toggle('expanded');
});
container2.addEventListener('click', () => {
    container2.classList.toggle('expanded');
});

pause.addEventListener('click', () => {
    if(!isPaused){
        isPaused = true;
        pause.textContent = 'Resume';
        stopInterval();
        console.log('Paused');
    }else{
        isPaused = false;
        pause.textContent = 'Pause';
        startInterval();
        console.log('Resumed');
    }
    
});

alarmEmoji.addEventListener('click', function () {
    if (alarm) {
        alarm = false;
        alarmEmoji.innerText = '🔇';
    } else {
        alarm = true;
        alarmEmoji.innerText = '🔊';
    }
});

alarmEmoji1.addEventListener('click', function () {
    if (alarm1) {
        alarm1 = false;
        alarmEmoji1.innerText = '🔇';
    } else {
        alarm1 = true;
        alarmEmoji1.innerText = '🔊';
    }
});

function connect() {
    const socket = new WebSocket('wss://fstream.binance.com/ws/btcusdt@aggTrade/btcusdt@markPrice@1s');
    socket.onopen = () => {
        console.log('Connected to the Server');
        isPaused = false;
    }

    socket.onmessage = (event) => {
        if (!isPaused) {
            const data = JSON.parse(event.data);

            if (data.e === 'aggTrade') {
                const price = parseFloat(data.p);
                const size = parseFloat(data.q);
                const time = new Date(data.T).toLocaleTimeString('en-US', { hour12: false });
                const sum = Math.round(size * price);

                let bgColor = null;
                let lightText = false;

                const isMaker = data.m;
                const threshold1 = 100000;

                if (sum >= threshold1) {
                    if (isMaker) {
                        if (sum < 300000) bgColor = 'rgb(53, 1, 1)';
                        else if (sum < 600000) bgColor = 'rgb(101, 2, 2)';
                        else if (sum < 1000000) bgColor = 'rgb(151, 6, 6)';
                        else { 
                            bgColor = 'rgb(255, 7, 7)';
                            lightText = true; 
                            if (alarm1) alarmSound1.play();}
                    } else {
                        if (sum < 300000) bgColor = 'rgb(1, 53, 1)';
                        else if (sum < 600000) bgColor = 'rgb(2, 101, 2)';
                        else if (sum < 1000000) bgColor = 'rgb(6, 151, 6)';
                        else { 
                            bgColor = 'rgb(7, 255, 7)';
                            lightText = true;
                            if (alarm1) alarmSound1.play();
                        }
                    }
                }

                if (bgColor) {
                    updateElement(price, sum, bgColor, 1, time, lightText);
                }

            } else if(data.e === 'markPriceUpdate') {
                const currentPrice = parseFloat(data.p);
                markPrice.innerHTML = `Mark Price: <span>${currentPrice.toFixed(2)}</span>`;
            }
            
        }
        

    }

    socket.onerror = (err) => {
        console.log(`Error:\n${err}`);
    }

    socket.onclose = (event) => {
        console.log('Websocket disconnected');
        console.log('Reason: ', event.reason || 'no reason given');
    }

    if (!isPaused) {
        startInterval();
    }
    
}


function updateElement(price, sum, bg, whatContainer, time='', light=false, bidask='') {
    const newData = document.createElement('div');
    newData.classList.add('new-data');
    newData.style.backgroundColor = bg;

    if(whatContainer == 1){
        newData.innerHTML = `
            <span>Price: ${price.toLocaleString()}</span>
            <span>Amount: ${sum.toLocaleString()}</span>
            <span>Time: ${time}</span>
        `;

        container1.prepend(newData);

        if (light) {
            newData.style.color = 'rgb(50, 50, 50)';
        } else {
            newData.style.color = '#e0e0e0';
        }

        while(container1.children.length > 10) {
            container1.removeChild(container1.lastChild);
        }

    } else if(whatContainer == 2){
        if (bidask === 'ask') {
            newData.innerHTML = `
                <span>Price: ${price.toLocaleString()}</span>
                <span>Amount: ${sum.toLocaleString()} </span>
                <span class="positionType">Ask</span>
            `;
        } else if (bidask == 'bid') {
            newData.innerHTML = `
                <span>Price: ${price.toLocaleString()}</span>
                <span>Amount: ${sum.toLocaleString()} </span>
                <span class="positionType">Bid</span>
            `;
        }
        
        container2.prepend(newData);

        if (light) {
            newData.style.color = 'rgb(50, 50, 50)';
        } else {
            newData.style.color = '#e0e0e0';
        }

        while(container2.children.length > 10) {
            container2.removeChild(container2.lastChild);
        }
    }
    
}

async function openInterest() {
    const symbol = 'BTCUSDT';
    const url = `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`;
    const response = await fetch(url);
    const data = await response.json();
    const openInt = parseInt(data.openInterest);
    oi.innerHTML = `Open Interest: <span class="oi">${openInt}</span> Contracts`;
}


async function getDepth() {
    const url = 'https://fapi.binance.com/fapi/v1/depth?symbol=BTCUSDT&limit=1000';
    const response = await fetch(url);
    const data = await response.json();
    const asks = data.asks;
    const bids = data.bids;

    const asksObj = {};
    const bidsObj = {};

    asks.forEach((ask) => {
        const price = parseInt(ask[0]);
        const amount = parseFloat(ask[1]);
        if (asksObj[price]) {
            asksObj[price] += amount;
        } else {
            asksObj[price] = amount;
        }
    });

    bids.forEach((bid) => {
        const price = parseInt(bid[0]);
        const amount = parseFloat(bid[1]);
        if (bidsObj[price]) {
            bidsObj[price] += amount;
        } else {
            bidsObj[price] = amount;
        }
    });

    const asksResult = Object.entries(asksObj).map( ([price, amount]) => [parseInt(price), amount] );
    const bidsResult = Object.entries(bidsObj).map( ([price, amount]) => [parseInt(price), amount] );

    for (let i=0; i<asksResult.length; i++){
        asksResult[i].push('ask');
    }

    for (let i=0; i<bidsResult.length; i++){
        bidsResult[i].push('bid');
    }

    const mergeAll = [...asksResult, ...bidsResult];
    const sizeInUSD = mergeAll.map( ([price, size, bidask]) => {
        return [price, Math.round(price * size), bidask];
    });

    sizeInUSD.sort( (a,b) => a[1] - b[1] );

    const threshold1 = 500000;
    const threshold2 = 1000000;
    const threshold3 = 5000000;
    const threshold4 = 10000000;

    let bg = null;
    let lightText = false;
    sizeInUSD.forEach( ([price, size, bidask]) => {
        if (bidask === 'ask'){
            if      (size >= threshold1 && size < threshold2) bg = 'rgb(52, 0, 0)'; 
            else if (size >= threshold2 && size < threshold3) bg = 'rgb(91, 0, 0)';
            else if (size >= threshold3 && size < threshold4) bg = 'rgb(154, 0, 0)';
            else if (size >= threshold4)                     {
                bg = 'rgb(255, 3, 3)';
                lightText = true;
                if (alarm) alarmSound.play();
            }
            else                                              bg = 'rgb(172, 172, 172)';
            updateElement(price, size, bg, 2, '', lightText, 'ask');
        } else if (bidask === 'bid') {
            if      (size >= threshold1 && size < threshold2) bg = 'rgb(7, 52, 0)';
            else if (size >= threshold2 && size < threshold3) bg = 'rgb(26, 91, 0)';
            else if (size >= threshold3 && size < threshold4) bg = 'rgb(15, 154, 0)';
            else if (size >= threshold4) {
                bg = 'rgb(66, 255, 3)';
                lightText = true;
                if (alarm) alarmSound.play();
            }
            else                                              bg = 'rgb(172, 172, 172)';
            updateElement(price, size, bg, 2, '', lightText, 'bid');
        }
        
    });


}

async function LSRatio(){
    const periods = ['5m', '4h', '1D'];
    const result = [];
    for(let item of periods){
        const url = `https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=btcusdt&period=${item}&limit=1`;
        const response = await fetch(url);
        const data = await response.json();
        const ratio = parseFloat(data[0]['longShortRatio']);
        result.push([ratio, item]);
    }

    result.forEach((item) => {
        const span = document.createElement('span');
        span.classList.add('box');
        if(item[0] > 1){
            span.innerHTML = `${item[1]}: <span class="bullish">Bullish </span>`;
        } else if(item[0] < 1) {
            span.innerHTML = `${item[1]}: <span class="bearish">Bearish </span>`;
        } else {
            span.innerHTML = `${item[1]}: <span class="neutral">Neutral</span>`;
        }

        topsStatus.append(span);
        while(topsStatus.children.length > 3){
            topsStatus.removeChild(topsStatus.lastChild);
        }
    });
}

function startInterval(currentPrice){
    if(!intervalId) {
        intervalId = setInterval( () => {
            openInterest();
            getDepth(currentPrice);
            LSRatio();
        }, 5000);
    }
}

function stopInterval() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

connect();