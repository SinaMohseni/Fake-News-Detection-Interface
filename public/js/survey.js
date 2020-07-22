function maybeShowSurvey(sess)
{
  if(sess.show_survey && sess.show_survey != "")
  {
    showSurvey(sess.show_survey)
  }
}

function showSurvey(surveyId)
{
  console.log("show survey: "+surveyId)
  let popup = $('#popupSurvey')[0]
  popup.dataset.survey = surveyId
  popup.classList.remove('hidden')
  popup.classList.add('visible')
}

function submitSurvey()
{
  let going = $("input[name='going']:checked").val();
  let why = $("input[name='why']:checked").val();

  let popup = $('#popupSurvey')[0]
  let surveyId = popup.dataset.survey;

  if(going && why && surveyId)
  {
    axios.post('/log/', {
        action: "survey - "+surveyId,
        info: {
            going: going,
            why: why
        }
      }
    );
    axios.post('/studyEvent', {
        action: surveyId,
      }
    );

    popup.classList.add('hidden')
    popup.classList.remove('visible')
  }
  else
  {
     $("#surveyErrorMessage").text("Please answer all the questions.")
  }
}
