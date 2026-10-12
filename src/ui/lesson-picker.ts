/* sql-cartographer v3.2.0 — accessible, replacement-safe lesson chooser. */
interface LessonPickerOptions {
  inputId: string;
  menuId: string;
  dialogId: string;
  confirmId: string;
  cancelId: string;
  closePanelId: string;
  panelId: string;
  titleId: string;
  goalId: string;
  stepsId: string;
  lessons: Record<string, GuidedLesson>;
  extraButtons?: Array<{id: string; createLesson: () => GuidedLesson}>;
  onLoad: (lesson: GuidedLesson) => void;
}

function lessonPickerAttach(options: LessonPickerOptions): void {
  var input=document.getElementById(options.inputId) as HTMLTextAreaElement|null;
  var menu=document.getElementById(options.menuId) as HTMLDetailsElement|null;
  var dialog=document.getElementById(options.dialogId) as HTMLDialogElement|null;
  var confirm=document.getElementById(options.confirmId) as HTMLButtonElement|null;
  var cancel=document.getElementById(options.cancelId) as HTMLButtonElement|null;
  var panel=document.getElementById(options.panelId) as HTMLElement|null;
  var title=document.getElementById(options.titleId), goal=document.getElementById(options.goalId);
  var steps=document.getElementById(options.stepsId);
  var closePanel=document.getElementById(options.closePanelId) as HTMLButtonElement|null;
  if(!input||!menu||!dialog||!confirm||!cancel||!panel||!title||!goal||!steps||!closePanel) return;
  var lessonInput:HTMLTextAreaElement=input, lessonMenu:HTMLDetailsElement=menu,
      lessonDialog:HTMLDialogElement=dialog, applyButton:HTMLButtonElement=confirm,
      cancelButton:HTMLButtonElement=cancel, lessonPanel:HTMLElement=panel,
      lessonTitle:HTMLElement=title, lessonGoal:HTMLElement=goal,
      lessonSteps:HTMLElement=steps, panelClose:HTMLButtonElement=closePanel;
  var pending: GuidedLesson|null=null, applying=false;

  function closeLesson(): void { lessonPanel.hidden=true; }
  function apply(lesson: GuidedLesson): void {
    applying=true;
    try{ options.onLoad(lesson); }
    finally{ applying=false; }
    if(lesson.showPanel===false){ closeLesson(); return; }
    lessonTitle.textContent=lesson.title;
    lessonGoal.textContent=lesson.goal;
    lessonSteps.textContent='';
    lesson.steps.forEach(function(text){
      var item=document.createElement('li');
      item.textContent=text;
      lessonSteps.appendChild(item);
    });
    lessonPanel.hidden=false;
    lessonMenu.open=false;
  }

  Array.prototype.forEach.call(lessonMenu.querySelectorAll('[data-guided-lesson]'),
    function(button: HTMLElement){
      button.addEventListener('click',function(){
        var id=button.getAttribute('data-guided-lesson');
        var lesson=id?options.lessons[id]:null;
        if(!lesson) return;
        pending=lesson;
        if(lessonInput.value.trim()) lessonDialog.showModal();
        else { pending=null; apply(lesson); }
      });
    });
  (options.extraButtons||[]).forEach(function(extra){
    var button=document.getElementById(extra.id);
    if(button) button.addEventListener('click',function(){
      var lesson=extra.createLesson();
      pending=lesson;
      if(lessonInput.value.trim()) lessonDialog.showModal();
      else { pending=null; apply(lesson); }
    });
  });
  applyButton.addEventListener('click',function(){
    if(!pending) return;
    var lesson=pending;
    pending=null;
    lessonDialog.close();
    apply(lesson);
  });
  cancelButton.addEventListener('click',function(){ pending=null; lessonDialog.close(); });
  lessonDialog.addEventListener('cancel',function(){ pending=null; });
  panelClose.addEventListener('click',closeLesson);
  lessonInput.addEventListener('input',function(){ if(!applying) closeLesson(); });
}
