/*
   Simple demo showing some interactivity options of Highcharts Gantt. More
   custom behavior can be added using event handlers and API calls. See
   http://api.highcharts.com/gantt.
*/
$(document).contextmenu(function() {
    return false;
});
//创建右键菜单
var epMenu={
    create:function(point,option){
        var menuNode=document.getElementById('epMenu');
        if(!menuNode){
            //没有菜单节点的时候创建一个
            menuNode=document.createElement("div");
            menuNode.setAttribute('class','epMenu');
            menuNode.setAttribute('id','epMenu');
        }else{
            $(menuNode).html('');
        }//清空里面的内容
        $(menuNode).css({left:point.left+'px',top:point.top+'px'});
        for(var x in option){
            var tempNode=document.createElement("a");
            $(tempNode).text(option[x]['name']).on('click',option[x].action);
            menuNode.appendChild(tempNode);
        }
        $("body").append(menuNode);
    },
    destory: function(){
        $(".epMenu").remove();
    }
};

function destory(){
    epMenu.destory();
}

function hideSysMenu() {
    return false;
}

var today = new Date(),
    hour = 1000 * 60 * 60,
    each = Highcharts.each,
    reduce = Highcharts.reduce,
    btnShowDialog = document.getElementById('btnShowDialog'),
    btnRemoveTask = document.getElementById('btnRemoveSelected'),
    btnAddTask = document.getElementById('btnAddTask'),
    btnCancelAddTask = document.getElementById('btnCancelAddTask'),
    addTaskDialog = document.getElementById('addTaskDialog'),
    inputName = document.getElementById('inputName'),
    selectDepartment = document.getElementById('selectDepartment'),
    selectDependency = document.getElementById('selectDependency'),
    chkMilestone = document.getElementById('chkMilestone'),
    isAddingTask = false;
// Set to 00:00:00:000 today
today.setUTCHours(0);
today.setUTCMinutes(0);
today.setUTCSeconds(0);
today.setUTCMilliseconds(0);
today = today.getTime();
// Update disabled status of the remove button, depending on whether or not we
// have any selected points.
function updateRemoveButtonStatus() {
    var chart = this.series.chart;
    // Run in a timeout to allow the select to update
    setTimeout(function () {
        btnRemoveTask.disabled = !chart.getSelectedPoints().length ||
            isAddingTask;
    }, 10);
}

function dealTime(points, childNodes, e, isBegin, current, end){
    if(childNodes.length)  {
        if  (isBegin) {
            childNodes.forEach(p =>{
                let diff = e.newPoint.end - p.start;
                // selfStart = Highcharts.dateFormat('%Y-%m-%d %H:%M', e.newPoint.start)
                // selfEnd = Highcharts.dateFormat('%Y-%m-%d %H:%M', e.newPoint.end)//%Y-%m-%d %H:%M:%S
                if(e.newPoint.end > p.start) {
                    p.update({
                        start: p.start + diff,
                        end: p.end+ diff
                    }, false);
                    dealTime(points, childNodes, e, false, p, p.end)
                    // childStart = Highcharts.dateFormat('%Y-%m-%d %H:%M', p.start)
                    // alert(childStart)
                    // childEnd = Highcharts.dateFormat('%Y-%m-%d %H:%M', p.end)
                }
            })
        }
        else {
            let childNodes = [];
            points.forEach(p => {
                if (p.dependency){
                    if (p.dependency.includes(current.id)) {
                        childNodes.push(p)
                    }
                }
            });
            if (childNodes.length) {
                childNodes.forEach(p => {
                    if (end > p.start) {
                        p.update({
                            start: end,
                            end: end + (p.end - p.start)
                        }, false);
                        // childStart = Highcharts.dateFormat('%Y-%m-%d %H:%M', p.start)
                        // alert(childStart)
                        // childEnd = Highcharts.dateFormat('%Y-%m-%d %H:%M', p.end)
                        dealTime(points, childNodes, e, false, p, p.end)
                    }
                })
            }

        }
    }

}

function dropmMethod1(points, e){
    let id = e.newPointId;
    if(id) {
        let childNodes = [];
        points.forEach(p => {
            if(p.dependency){
                if(p.dependency.includes(id)) {
                    childNodes.push(p)
                }
            }
        });

        dealTime(points, childNodes, e, true)
    }
}

function dropmMethod2(points, e) {
    let dependency = e.target.options.dependency;
    let dependencyPoint = null;
    if (dependency) {
        points.forEach(p => {
            if (dependency.includes(p.id)) {
                dependencyPoint = p;
            }
        });
        if (e.newPoint.start < dependencyPoint.end) {
            e.newPoint.start =  dependencyPoint.end;
            e.newPoint.end = dependencyPoint.end + this.lens[e.newPointId]
        }
        updateLen(points, e)

    }
}

function getColorsAndLens(points){
    if (this.colors == undefined){
        let colors = {};
        let lens = {};
        points.forEach(p => {
            colors[p.y] = p.color
            lens[p.id] = p.end - p.start
        });
        window.colors = colors
        this.lens = lens
    }
}

function changeColor(points, e){
    let id = e.newPointId;
    if(id) {
        points.forEach(p => {
            if(p.id === id) {
                var dragY = p.dragDrop.draggableY;
                var dragX = p.dragDrop.draggableX;
                if(dragX && dragY){
                    p.update({
                        color: this.colors[p.y]
                    }, false);
                }
            }
        });
    }
}

function updateLen(points, e){
    let id = e.newPointId;
    if(id) {
        points.forEach(p => {
            if(p.id === id) {
                this.lens[p.id] = p.end - p.start
            }
        });
    }
}

function clickMouseY(event, thisPoint){
    var btnNum = event.button;
    if (btnNum==2){
        // 固定设备
        var fixEquip = function() {
            console.log(thisPoint)
            thisPoint.update({
                dragDrop:{draggableY: false},
                color: "#EA0000"
            }, true);
            epMenu.destory();
        }

        // 固定时间
        var fixTime = function() {
            thisPoint.update({
                dragDrop:{draggableX: false},
                color: "#EA0000"
            }, true);
            epMenu.destory();
        }

        // 解除固定
        var reliveFix = function() {
            console.log(this.colors)
            // 使得固定的设备可以上下，左右修改
            thisPoint.update({
                dragDrop:{
                    draggableX: true,
                    draggableY: true
                },
                color: window.colors[thisPoint.y]
            }, true);
            epMenu.destory();
        }


        // 固定设备和时间
        var fixTimeAndEquip = function() {
            thisPoint.update({
                dragDrop:{
                    draggableX: false,
                    draggableY: false
                },
                color: "#EA0000"
            }, true);
            epMenu.destory();
        }
        document.oncontextmenu = hideSysMenu;//屏蔽鼠标右键
        var evt = window.event || arguments[0];
        var rightedge = evt.clientX;
        var bottomedge = evt.clientY;
        epMenu.create({left:rightedge,top:bottomedge},[
            {name:'固定设备','action':fixEquip},
            {name:'固定时间','action':fixTime},
            {name:'解除固定','action':reliveFix},
            {name:'固定设备和时间','action':fixTimeAndEquip},
            {name:'退出','action':destory}]);
        window.onclick=function(e){
            epMenu.destory();
        }
    }
}


// Create the chart
var chart = Highcharts.ganttChart('container', {
    chart: {
        spacingLeft: 1,
    },
    title: {
        text: 'Interactive Gantt Chart'
    },
    subtitle: {
        text: 'Drag and drop points to edit'
    },

    plotOptions: {
        series: {
            // events: {
            //     mousedown: function (e) {
            //         clickMouseY(e, this);
            //     },
            // },
            animation: true, // animate dependency connectors
            dragDrop: {
                draggableX: true,
                draggableY: true,
                dragMinY: 0,
                dragMaxY: 2,
                dragPrecisionX: hour / 60 // Snap to 1 min
            },
            dataLabels: {
                enabled: true,
                format: '{point.name}',
                style: {
                    cursor: 'default',
                    pointerEvents: 'none',
                }
            },
            allowPointSelect: false,
            point: {
                events: {
                    contextmenu: function(event) {
                        // console.log(window.colors)
                        clickMouseY(event, this);
                        if (document.all) {
                            window.event.returnValue = false;
                        }// for IE
                        else {
                            event.preventDefault();
                        }
                    },

                    dragStart: function(e) {
                        // clickMouseY(e, this)
                        getColorsAndLens(this.series.points)
                    },
                    drag: function(e) {
                        // console.log(e)
                    },
                    /**
                     *  拖拽限制：
                     *  1. 父节点拖动超过子节点开始时间时，子节点自动对齐父节点的结束时间
                     *  2. 叶子节点拖动开始时间小于父节点的结束时间时，子节点开始时间设置为父节点的结束时间
                     */
                    drop: function(e) {
                        changeColor(this.series.points, e)
                        // 1.
                        dropmMethod1(this.series.points, e)
                        // 2.
                        dropmMethod2(this.series.points, e)
                    },



                }
            }
        }
    },
    yAxis: {
        scrollbar: {
            enabled: true,
            showFull: false
        },
        type: 'categorie',
        //树状结构下的甘特图highcharts还不支持上下拖动，详情：https://github.com/highcharts/highcharts/issues/14400
        categories: ['Tech', 'Marketing', 'Sales'],
        // min: 0,
        // max: 2
    },
    xAxis: {
        currentDateIndicator: false
    },
    navigator: {
        enabled: true
    },
    scrollbar: {
        enabled: true
    },
    rangeSelector: {
        enabled: true,
    },
    tooltip: {
        // headerFormat: null,
        xDateFormat: '%a %b %d, %H:%M',
        // pointFormat: '{point.name}: <b>{point.id}</b>',  //鼠标放在每个饼图上显示内容。显示 “选项：百分比”
    },
    series: [{
        name: 'Project 1',
        data: [
            {
                "start": 1643700469000,
                "end": 1643786869000,
                "name": null,
                "id": "1493478671917273090",
                "y": 0,
                "resourceId": "1470658948301414402",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            },
            {
                "start": 1645428469000,
                "end": 1645428469000,
                "name": null,
                "id": "1493479024666628098",
                "y": 0,
                "resourceId": "1470658948301414402",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            },
            {
                "start": 1645169269000,
                "end": 1645255669000,
                "name": null,
                "id": "1493478833733521409",
                "y": 2,
                "resourceId": "1470659127385612289",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            },
            {
                "start": 1645774069000,
                "end": 1645860469000,
                "name": "1493479400266551297",
                "id": "1493479400266551297",
                "y": 0,
                "dependency": [
                    "1493478671917273090",
                    "1493478833733521409",
                    "1493479232687329282"
                ],
                "resourceId": "1470658948301414402",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            },
            {
                "start": 1646281669000,
                "end": 1646897269000,
                "name": "1493479781054828545",
                "id": "1493479781054828545",
                "y": 0,
                "dependency": [
                    "1493479631498530817"
                ],
                "resourceId": "1470658948301414402",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            },
            {
                "start": 1650526069000,
                "end": 1650612469000,
                "name": "1493480226141786113",
                "id": "1493480226141786113",
                "y": 0,
                "dependency": [
                    "1493480107044524033"
                ],
                "resourceId": "1470658948301414402",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            },
            {
                "start": 1647502069000,
                "end": 1647588469000,
                "name": "1493479915771678722",
                "id": "1493479915771678722",
                "y": 1,
                "dependency": [
                    "1493479781054828545"
                ],
                "resourceId": "1472805452449341442",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            },
            {
                "start": 1649230069000,
                "end": 1649316469000,
                "name": "1493480107044524033",
                "id": "1493480107044524033",
                "y": 1,
                "dependency": [
                    "1493479915771678722"
                ],
                "resourceId": "1472805452449341442",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            },
            {
                "start": 1645601269000,
                "end": 1645687669000,
                "name": "1493479232687329282",
                "id": "1493479232687329282",
                "y": 2,
                "dependency": [
                    "1493479024666628098"
                ],
                "resourceId": "1470659127385612289",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            },
            {
                "start": 1645946869000,
                "end": 1646033269000,
                "name": "1493479631498530817",
                "id": "1493479631498530817",
                "y": 2,
                "dependency": [
                    "1493478833733521409",
                    "1493479400266551297"
                ],
                "resourceId": "1470659127385612289",
                "dragDrop": {
                    "draggableX": true,
                    "draggableY": true
                }
            }
        ]
    }]
});

function showTask(){
    var addTaskDialog = document.getElementById("addTaskDialog");
    //菜单显示
    addTaskDialog.style.display = "block";
}

function cancelTask(){
    var addTaskDialog = document.getElementById("addTaskDialog");
    //菜单隐藏
    addTaskDialog.style.display = "none";
}

function dealTask(){
    //自定义功能

    //菜单隐藏
    addTaskDialog.style.display = "none";

}

