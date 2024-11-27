function createIcon(icontype) {
    const span = document.createElement('span');
    span.classList.add(icontype, 'fucking-icon');

    return span
}

function areSameLists(items, newItems) {
    for(let i = 0; i < items.length; i++) {
        if(items[i].isSameNode(newItems[i])) {
            return false;
        }
    }

    return items.length == newItems.length;
}

function addCommasToNumber(num) {
    let strNum = num.toString();

    if(strNum.length > 3) {
        for(let i = strNum.length-3; i >= 1; i -= 3) {
            strNum = strNum.substring(0, i) + ',' + strNum.substring(i);
        }
    }

    return strNum;
}

function isTrue(num) { return num == 1; } // FOr checking if the num is -1 or 1.

var itemsData;
var timestamp;

const TIME_TO_RESET = 60;

const port = chrome.runtime.connect();

port.onMessage.addListener((message) => {
    if(timestamp == null || new Date().getMinutes - timestamp >= TIME_TO_RESET) {
        itemsData = message;
        timestamp = new Date().getMinutes();
    }
});

function getProjHypeOrRareDivs(itemArray) {
    const isProj = isTrue(itemArray[7]);
    const isHype = isTrue(itemArray[8]); // Is hype is getting sunset though I'm pretty sure
    const isRare = isTrue(itemArray[9]);

    var divs = document.createDocumentFragment();

    if (isProj) { divs.appendChild(createIcon('fucking-projected-icon')); }
    if (isHype) { divs.appendChild(createIcon('fucking-hype-icon')); }
    if (isRare) { divs.appendChild(createIcon('fucking-rare-icon')); }

    console.log(divs);
    return divs.children;
}

function valueDiv(tagsToAdd, itemValue, textClass) {
    const div = document.createElement('div');
    div.classList.add('item-card-price');
    
    const icon = createIcon('fucking-transmons-icon');
    
    const value = document.createElement('span');
    value.innerText = itemValue;
    value.classList.add(textClass, 'fucking-rolimon-value');
    
    div.appendChild(icon);
    div.appendChild(value);

    for (const tag of tagsToAdd) { 
        console.log(typeof(tag));
        div.appendChild(tag); }

    return div;
}

var offers;
const ITEM_TO_TOTAL_RATIO = 0.3; // If an item's ratio to the total value of the trade is less than this, then don't add its name to the proof.
// trade-list-detail-offer
// item-card-caption'
async function addValueToItem(observer, newOffers, receiver) {
    if(!offers || !areSameLists(offers, newOffers)) {
        observer.disconnect();
        offers = newOffers;

        let proofItems = "";
        let proofSender = "";
        
        let offerValue = 0;
        let requestValue = 0;

        if(itemsData == undefined) {
            let intId = setInterval(function() {
                if(itemsData != undefined) {
                    clearInterval(intId);
                }
            }, 100);
        }

        for(let i = 0; i < offers.length; i++) {
            const items = offers[i].getElementsByClassName('item-card-caption');
            const isGivingSide = offers[i].getElementsByClassName('trade-list-detail-offer-header')[0].innerText.includes("give"); 
            const robuxLines = offers[i].getElementsByClassName('robux-line-amount');
            const senderElements = document.getElementsByClassName('element');
            
            let itemValues = 0;
            var sideData = [];
            for(let j = 0; j < items.length; j++) {
                if(!items[j].getElementsByClassName('fucking-rolimon-value').length > 0 && itemsData != undefined) {
                    const id = items[j].getElementsByTagName('a')[0].href.match("[0-9]+")[0]; // Only one link so it will be the first index.
                    const itemData = itemsData['items'][id];
                    const itemValue = itemData[4];

                    sideData.push(itemData);

                    const div = valueDiv(getProjHypeOrRareDivs(itemData), addCommasToNumber(itemValue), 'text-robux');
                    items[j].appendChild(div);

                    itemValues += itemValue;
                }
            }

            for(let j = 0; j < sideData.length; j++) {
                const itemData = sideData[j];
                let proofAcro = itemData[1]

                let isNotSignificantItem = itemData[4]/itemValues < ITEM_TO_TOTAL_RATIO;

                if(isNotSignificantItem && j == sideData.length-1) {
                    proofItems = proofItems.replace(new RegExp(", "), "");
                    continue;
                }
                else if(isNotSignificantItem) {continue;}
                if(proofAcro) { proofItems += `${proofAcro}`; }
                else {
                    proofItems += itemData[0];
                }

                if(j != items.length-1) {
                    proofItems += ", ";
                }
            }

            if(i != offers.length-1) { 
                proofItems += " VS "; 
                proofSender = senderElements[1].innerText;
            }

            const robuxAmount = parseInt(robuxLines[0].innerText.replace(",", ""));
            itemValues += Math.round(parseInt(robuxAmount, 10) / 0.7);

            // Set the values to be on the correct side.
            if(isGivingSide) {
                offerValue = itemValues;
            } else {
                requestValue = itemValues;
            }

            const robuxLine = robuxLines[1];


            if(robuxLine.getElementsByClassName('fucking-rolimon-value').length < 1) {
                var value = offerValue;
    
                if(!isGivingSide) { 
                    value = requestValue; 
                }
    
                const totalValue = valueDiv([], addCommasToNumber(value), 'text-robux-lg');
                robuxLine.appendChild(totalValue);
            }
        }
        
        observer.observe(document.body, config);

        let selected = document.getElementsByClassName('selected');
        
        let date;

        if(selected[0] != undefined && selected[0].getElementsByClassName('trade-sent-date') != undefined) {
            date = selected[0].getElementsByClassName('trade-sent-date')[0];
        }

        let dateText;

        if(date.innerText.match('[0-9]+/[0-9]+/[0-9]+')) {
            dateText = date.innerText;
        } else {
            dateText = date.title;
        }

        if(offerValue > 0 && requestValue > 0 && date != undefined) {
            const proof = proofItems + "\n" + 
            `Values: ${addCommasToNumber(offerValue)} VS ${addCommasToNumber(requestValue)}` + "\n" +
            `Sender: ${proofSender}` + "\n" + 
            `Receiver: ${receiver}` + "\n" + 
            `Date: ${dateText}`;

            console.log(proof);
        }
        
    }
}

const callback = (mutationList, observer) => {
    const newItems = document.getElementsByClassName('trade-list-detail-offer');
    const nameTag = document.head.getElementsByTagName('meta')[8];

    addValueToItem(observer, newItems, nameTag.getAttribute('data-name'));
}


const target = document.getElementsByClassName('trades-list-detail')[0];
const config = {childList : true, subtree: true};

const observer = new MutationObserver(callback);
observer.observe(document.body, config);

port.postMessage('Recieved');
setInterval(() => {
    if(timestamp == null || new Date().getMinutes - timestamp >= TIME_TO_RESET) {
        port.postMessage('Recieved');
    } else {
        port.postMessage('Already recieved');
    }
}, 10000);