;(function () {
    'use strict';


    var $form_add_task = $('.add-task')
        ,$window = $(window)
        ,$body = $('body')
        ,$delete_task
        ,$task_detail_trigger
        ,$task_detail = $('.task-detail')
        ,$task_detail_mask = $('.task-detail-mask')
        ,task_list = []
        ,current_index
        ,$update_form
        ,$task_detail_content
        ,$task_detail_content_input
        ,$checkbox_complete
        ,$msg = $('.msg')
        ,$msg_content = $msg.find('.msg-content')
        ,$msg_confirm = $msg.find('.confirmed')
        ,$alerter = $('.alerter')
    ;

        init();


    $form_add_task.on('submit',on_add_task_form_submit);
    $task_detail_mask.on('click',hide_task_detail);

    function listen_msg_event() {
        $msg_confirm.on('click',function () {
            hide_msg();
        })
    }

    function on_add_task_form_submit(e) {
        var new_task={};
        /*禁用默认行为*/
        e.preventDefault();
        /*获取新Task的值*/
        var $input= $(this).find('input[name=content]');
        new_task.content = $input.val();
        /*如果新Task的值为空 则直接返回 否则继续执行*/
        if(!new_task.content) return;
        /*存入新Task的值*/
        if (add_task(new_task)){
            /* render_task_list();*/
            $input.val(null);
        }
    }

    /*查找并监听所有删除按钮的点击事件*/
    function listen_task_delete() {
        $delete_task.on('click',function () {
            var $this = $(this);
            /*找到删除按钮所在的task元素*/
            var $item = $this.parent().parent();
            var index = $item.data('index');
            /*确认删除*/
            var tmp = pop('确定删除？')
                .then(function (r) {
                    r ? delete_task(index):null;
                });
        })
    }

    /*监听打开task详情事件*/
    function  listen_task_detail() {
             var index;
            $('.task-item').on('dblclick',function () {
                index = $(this).data('index');
                show_task_detail(index);
            });
            $task_detail_trigger.on('click',function () {
                var $this = $(this);
                var $item = $this.parent().parent();
                index = $item.data('index');
                show_task_detail(index);
            })
    }

    /*监听完成task事件*/
    function listen_checkbox_complete() {
        $checkbox_complete.on('click',function(){
            var $this = $(this);
            var index = $this.parent().parent().data('index');
            var item = get(index);
            if(item.complete)
                update_task(index,{complete: false});
            else
                update_task(index,{complete: true});
        })
    }

    function get(index) {
        return store.get('task_list')[index];
    }

    /*查看task详情*/
    function show_task_detail(index) {
        /*生成详情模板*/
        render_task_detail(index);
        current_index = index;
        /*显示详情模板（默认隐藏）*/
        $task_detail.show();
        /*显示详情模板mask（默认隐藏）*/
        $task_detail_mask.show();
    }

    /*隐藏task详情*/
    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    /*更新task*/
    function update_task(index,data) {
        if( !index || !task_list[index]) return;
        task_list[index] = $.extend({},task_list[index],data);
        refresh_task_list();
    }

    /*渲染指定task的详细信息*/
    function render_task_detail(index) {
        if( index === undefined || !task_list[index]) return;
        var item = task_list[index];
        var tpl =
        '<form>'+
            '<div class="content">'+ (item.content || '')+ '</div>'+
            '<div class="input-item"><input style="display: none" type="text" name="content" value="'+ item.content+'"><div>'+
            '<div>'+
                '<div class="desc">'+
                '<textarea name="desc" >'+ (item.desc || '') +'</textarea>'+
            '</div>'+
            '</div>'+
                '<div class="remind input-item">'+
                '<label>提醒时间<label>'+
                '<input class="datetime"  name="remind_date" type="text" value="'+(item.remind_date || '')+'">'+
            '</div>'+
            '<div class="input-item"><button type="submit">更新</button><div>'+
        '</form>';

        /*清空task详情模板*/
        $task_detail.html(null);
        /*用新模板替换*/
        $task_detail.html(tpl);

        $('.datetime').datetimepicker();

        /*选中其中的form元素，因为之后会使用其监听submit事件*/
        $update_form = $task_detail.find('form');
        /*选中显示task内容元素*/
        $task_detail_content = $update_form.find('.content');
        /*选中task input元素*/
        $task_detail_content_input = $update_form.find('[name=content]');

        /*双击内容元素显示input，隐藏自己*/
        $task_detail_content.on('dblclick',function () {
            $task_detail_content_input.show();
            $task_detail_content.hide();
        });

        $update_form.on('submit',function (e) {
            e.preventDefault();
            var data={};
            /*获取form中各个input的值*/
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            update_task(index,data);
            hide_task_detail();
        })
    }

    function add_task(new_task) {
        /*将新Task推入task_list*/
        task_list.push(new_task);
        /*更新localStorage*/
        refresh_task_list();
        return true;
    }

    function init() {
        task_list = store.get('task_list') || [];
        listen_msg_event();
        if(task_list.length)
            render_task_list();
        task_remind_check();
    }
    
    function pop(arg) {
        if(!arg){
            console.log('pop title is required');
        }
        var conf = {}
                    ,$box
                    ,$mask
                    ,$nail
                    ,$pop_title
                    ,$pop_content
                    ,$confirm
                    ,$cancel
                    ,dfd
                    ,confirmed
                    ,timer
        ;

        dfd = $.Deferred();

        if( typeof arg == 'string' )
            conf.title = arg;
        else {
            conf = $.extend({},arg);
        }

        $box = $(
            '<div>'+
                '<div class="pop-title">'+conf.title+'</div>'+
                '<div class="pop-content">'+
                    '<div>' +
                        '<button class="primary confirm">确定</button><' +
                        'button class="primary cancel">取消</button>' +
                    '</div>'+
                '</div>'+
            '</div>')
            .css({
                width:300,
                height:200,
                position:'fixed',
                borderRadius:50,
                borderTopRightRadius:0,
                borderBottomRightRadius:20,
                borderBottomLiftRadius:35,
                background: '#7ed5d1',
                'box-shadow': '3px 4px 4px rgba(0,0,0,0.5)'
            });

        $pop_title = $box.find('.pop-title').css({
            padding:15,
            'font-weight':900,
            fontSize:22,
            textAlign:'center'
        });

        $pop_content = $box.find('.pop-content').css({
            padding:15,
            textAlign:'center'
        });

        $nail = $('<div></div> ').
            css({
                position:'absolute',
                width:20,
                height:20,
                borderRadius:10,
                background:'rgb(191, 91, 191)',
                top:10,
                right:10,
                'box-shadow': '3px 4px 4px rgba(0,0,0,0.5)'
            });

        $mask = $('<div></div>')
            .css({
                position: 'fixed',
                top:0,
                bottom:0,
                right:0,
                left:0,
                background:'#000',
                opacity:0.5
            });

        timer = setInterval(function () {
            if(confirmed !== undefined){
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        },50);

        $confirm = $pop_content.find('button.confirm');
        $cancel = $pop_content.find('button.cancel');

        $confirm.on('click',function () {
            confirmed = true;
        });

        $cancel.on('click',function () {
            confirmed = false;
        });

        $mask.on('click',function () {
            dismiss_pop();
        })

        function dismiss_pop() {
            $mask.remove();
            $box.remove();
        }

        function adjust_box_position() {

             var window_width = $window.width()
                 ,window_height = $window.height()
                 ,box_width = $box.width()
                 ,box_height = $box.height()
                 ,move_x
                 ,move_y;
                 move_x = (window_width - box_width)/2;
                 move_y = (window_height - box_height)/2-70;

             $box.css({
                 left:move_x,
                 top:move_y
             });
         }

         $window.on('resize',function () {
             adjust_box_position();
         });

        $mask.appendTo($body);
        $box.appendTo($body);
        $nail.appendTo($box);
        $window.resize();
        return dfd.promise();
    }
    
    function task_remind_check() {
        var current_timestamp;
        var itl = setInterval(function () {
            for(var i = 0;i<task_list.length;i++){
                var item = get(i),task_timestamp;
                if(!item || !item.remind_date ||item.informed)
                    continue;
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if(current_timestamp - task_timestamp >1){
                    update_task(i,{informed: true});
                    show_msg(item.content);
                }
            }
        },500);

    }
    
    function show_msg(msg) {
        if(!msg) return;
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }

    function hide_msg() {
        /*$alerter.get(0).pause();*/
        $msg.hide();
    }

    /*渲染全部task模板*/
    function render_task_list() {
        var $task_list = $('.tasks-list');
        $task_list.html('');
        var complete_items = [];
        for(var i = 0;i < task_list.length;i++){
            var item = task_list[i];
            if(item &&item.complete)
                complete_items[i]=(item);
            else
                var $task = render_task_item(item,i);
            $task_list.prepend($task);
        }

        for(var j = 0;j < complete_items.length;j++){
            $task = render_task_item(complete_items[j],j);
            if(!$task) continue;
            $task.addClass('completed');
            $task_list.append($task);

        }
        $delete_task = $('.action.delete');
        $task_detail_trigger = $('.action.detail');
        $checkbox_complete = $('.tasks-list .complete[type=checkbox]');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
    }

    
    /*渲染单条task模板*/
    function render_task_item(data,index) {
        if(!data || index === undefined) return;
        var list_item_tpl =
            '<div class="task-item" data-index="'+index+'">'+
                '<span><input class="complete"' + (data.complete ? 'checked' : '')+ ' type="checkbox"></span>'+
                '<span class="task-content">'+data.content+'</span>'+
                '<span class="fr">'+
                    '<span class="action delete"> 删除</span>'+
                    '<span class="action detail"> 详细</span>'+
                '<span>'+
            '</div>';
        return $(list_item_tpl);
    }

    /*删除一条task*/
    function delete_task(index) {
        /*如果没有index或者index不存在则直接返回*/
            if(index ===undefined || !task_list[index]) return;

            delete task_list[index];
            /*更新localStorage*/
            refresh_task_list();
    }

    /*刷新localStorage并渲染模板*/
    function refresh_task_list() {
        store.set('task_list',task_list);
        render_task_list();
    }
})();
