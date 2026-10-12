"use strict";
function lessonPickerAttach(options) {
    var input = document.getElementById(options.inputId);
    var menu = document.getElementById(options.menuId);
    var dialog = document.getElementById(options.dialogId);
    var confirm = document.getElementById(options.confirmId);
    var cancel = document.getElementById(options.cancelId);
    var panel = document.getElementById(options.panelId);
    var title = document.getElementById(options.titleId), goal = document.getElementById(options.goalId);
    var steps = document.getElementById(options.stepsId);
    var closePanel = document.getElementById(options.closePanelId);
    if (!input || !menu || !dialog || !confirm || !cancel || !panel || !title || !goal || !steps || !closePanel)
        return;
    var lessonInput = input, lessonMenu = menu, lessonDialog = dialog, applyButton = confirm, cancelButton = cancel, lessonPanel = panel, lessonTitle = title, lessonGoal = goal, lessonSteps = steps, panelClose = closePanel;
    var pending = null, applying = false;
    function closeLesson() { lessonPanel.hidden = true; }
    function apply(lesson) {
        applying = true;
        try {
            options.onLoad(lesson);
        }
        finally {
            applying = false;
        }
        if (lesson.showPanel === false) {
            closeLesson();
            return;
        }
        lessonTitle.textContent = lesson.title;
        lessonGoal.textContent = lesson.goal;
        lessonSteps.textContent = '';
        lesson.steps.forEach(function (text) {
            var item = document.createElement('li');
            item.textContent = text;
            lessonSteps.appendChild(item);
        });
        lessonPanel.hidden = false;
        lessonMenu.open = false;
    }
    Array.prototype.forEach.call(lessonMenu.querySelectorAll('[data-guided-lesson]'), function (button) {
        button.addEventListener('click', function () {
            var id = button.getAttribute('data-guided-lesson');
            var lesson = id ? options.lessons[id] : null;
            if (!lesson)
                return;
            pending = lesson;
            if (lessonInput.value.trim())
                lessonDialog.showModal();
            else {
                pending = null;
                apply(lesson);
            }
        });
    });
    (options.extraButtons || []).forEach(function (extra) {
        var button = document.getElementById(extra.id);
        if (button)
            button.addEventListener('click', function () {
                var lesson = extra.createLesson();
                pending = lesson;
                if (lessonInput.value.trim())
                    lessonDialog.showModal();
                else {
                    pending = null;
                    apply(lesson);
                }
            });
    });
    applyButton.addEventListener('click', function () {
        if (!pending)
            return;
        var lesson = pending;
        pending = null;
        lessonDialog.close();
        apply(lesson);
    });
    cancelButton.addEventListener('click', function () { pending = null; lessonDialog.close(); });
    lessonDialog.addEventListener('cancel', function () { pending = null; });
    panelClose.addEventListener('click', closeLesson);
    lessonInput.addEventListener('input', function () { if (!applying)
        closeLesson(); });
}
//# sourceMappingURL=lesson-picker.js.map