document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('a.btn-sweep-all').addEventListener('click', function() {
        chrome.runtime.sendMessage({
            action: 'sweep-all'
        });
        window.close();
    });
    document.querySelector('a.btn-sweep-fragment').addEventListener('click', function() {
        chrome.runtime.sendMessage({
            action: 'sweep-fragment'
        });
        window.close();
    });
    document.querySelector('a.btn-configure').addEventListener('click', function() {
        console.log('clicked');
        // window.close();
    });
});
