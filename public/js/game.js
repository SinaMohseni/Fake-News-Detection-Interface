function init()
{
  allConditionsOn()
}

function allConditionsOn()
{
  show('.lvl-one')
  show('.lvl-two')
  show('.lvl-three')
  show('.lvl-four')
  show('.cost')
  show('.value')
}

function showHideConditionals(condition)
{
  // should be hidden by default
  hide('.lvl-one')
  hide('.lvl-two')
  hide('.lvl-three')
  hide('.lvl-four')
  hide('.cost')
  hide('.value')

  if(condition == "simple") {
    show('.lvl-one')
  }
  if(condition == "intermediate") {
    show('.lvl-one')
    show('.lvl-two')
  }
  if(condition == "expert") {
    show('.lvl-one')
    show('.lvl-two')
    show('.lvl-three')
  }
  if(condition == "pro" || condition == "free" || condition == "optional") {
    show('.lvl-one')
    show('.lvl-two')
    show('.lvl-three')
    show('.lvl-four')
  }
  if(condition == 'optional') {
    show('.cost')
    show('.value')
  }
}
