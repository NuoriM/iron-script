const config = {
    loopTask: null,
    tela: Room.getFurniById(478104627),
}

const data = {
    player: {
        andando: {
            frames: [
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABPSURBVDhPYxhwwAilMcD//wz/oUw4YGTEVI8hgE0jOkA2CMUAYjTDAMwQJjCPAgB3ASm2wwDIFRS7YBgYMIiiEQYoSonIAJtByBqpBBgYAJl2FRSFntQXAAAAAElFTkSuQmCC',
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABkSURBVDhPxZFbDsAgCASh978zxsY1KNBs0zadHx+RAUF+R8caMBMb24lqfB8ussAdL1oETDCA5DhPD5gVsNn3PlCCrHmgFFwFeb6roKLsQYeVdCB6b4yAqcJ/IwhAJmIncwORBu/2IRALN9AQAAAAAElFTkSuQmCC',
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABnSURBVDhPxZJRDsAgCENh978zSxMkW4CK+9n7wSitCMrvqMeEmZgvA9WcnzYq4WJrcCoGl0dKJwZx0N3OxIBWsBOD1mAiBq0Ba+gT+oSJyavML40cjZH+D48BTS4qaUurjKaTOUDkBnl7HhRrTVFlAAAAAElFTkSuQmCC',
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABkSURBVDhPxZFbDsAgCASh978zxsY1KNBs0zadHx+RAUF+R8caMBMb24lqfB8ussAdL1oETDCA5DhPD5gVsNn3PlCCrHmgFFwFeb6roKLsQYeVdCB6b4yAqcJ/IwhAJmIncwORBu/2IRALN9AQAAAAAElFTkSuQmCC',
            ]
        }
    }
};

const tick = () => {

}

Commands.register(':teste', (user) => {
    // const adsFurni = Room.getFurniById(478104627);
    const adsData = config.tela.getAdsData();
    // let frameIndex = 0;

    config.loopTask = Delay.interval(tick, 8);
    // Delay.interval(() => {
    //     frameIndex = (frameIndex + 1) % data.player.andando.frames.length;
    //     adsData.setImageUrl(data.player.andando.frames[frameIndex]);
    //     adsData.refresh();
    // }, 1);
});

Commands.register(':pararTeste', (user) => {
    // user.message('Parando teste de comando!');
    Delay.cancel(config.loopTask);
    config.loopTask = null;
});