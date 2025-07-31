chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((message) => {
        if(message == "Recieved") {
            try {
                fetch('https://api.rolimons.com/items/v2/itemdetails').then(r => r.json()).then(result => {
                    port.postMessage(result);
                });
                
            } catch(error) {
                console.log(error);
            }
        } else {
            port.postMessage('Pong');
        }
    });
});



