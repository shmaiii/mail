window.onpopstate = function(event) {
  console.log(event.state.selected);
  if (event.state.selected === 'compose') {
    compose_email();
  } else {
    load_mailbox(event.state.selected);
  }
}

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', function() { 
    load_mailbox('inbox');
  });
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {

  history.pushState({selected: 'compose'}, "", `compose`);

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#view-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').addEventListener('submit', submit_email);

}

function compose_reply(oriEmail) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  //prefill composition field
  document.querySelector('#compose-recipients').value = oriEmail.sender;
  document.querySelector('#compose-subject').value = `Re:${oriEmail.subject}`;
  document.querySelector('#compose-body').value = `On ${oriEmail.timestamp}, ${oriEmail.sender} wrote: \n ${oriEmail.body} \n`;

  document.querySelector('#compose-form').addEventListener('submit', submit_email);
}

function submit_email(e) {
  
  e.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  //.then(response => response.json())
  .then(result => {
    load_mailbox('sent');
  })
  .catch(error => console.log(error));
  
  return false;

}


function load_mailbox(mailbox) {

  history.pushState({selected: mailbox}, "", `${mailbox}`);
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h1>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h1>`;


  fetch('/emails/'+ mailbox)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    emails.forEach(email => {
      const div = document.createElement('div');
      const divPeo = document.createElement('div');
      const divBody = document.createElement('div');
      const divTime = document.createElement('div');
      
      document.querySelector('#emails-view').append(div);
      div.appendChild(divPeo);
      div.appendChild(divBody);
      div.appendChild(divTime);

      if (mailbox === 'inbox' || mailbox === 'archive') {
        divPeo.innerHTML = `${email.sender}`
        const archButton = document.createElement('button');
        archButton.setAttribute('id', 'arc-button');
        div.append(archButton);

        if (mailbox == 'inbox') {
          archButton.innerHTML = 'archive';
          archButton.addEventListener('click', function() {

            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: true
              })
            });

            console.log(`${email.id} has been archived`);
            location.reload();

          });

        } else {
          archButton.innerHTML = 'unarchive';
          archButton.addEventListener('click', function() {

            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: false
              })
            });

            location.reload();
          });
        }
      }
      else if (mailbox === 'sent') {
        divPeo.innerHTML = `${email.recipients}`
      }

      divBody.innerHTML = `<label style="font-weight: bold;"> ${email.subject}</label>`;
      divTime.innerHTML = `${email.timestamp}`;

      //styling
      divBody.setAttribute('id', 'mail-body');
      div.setAttribute('id', 'mail-container');
      divPeo.setAttribute('id', 'mail-peo');
      divTime.setAttribute('id', 'mail-timestamp');

      if (email.read === true) {
        div.style.cssText += 'background-color:#E5E5E5;';
      } else {
        div.style.cssText += 'backgrounD-color: whitesmoke';
      }

      [divPeo, divBody, divTime].forEach(item => {
        item.addEventListener('click', function() {
          console.log(`${item.id} has been clicked`);
          viewEmail(email.id);
        })
      });

    });
});

}

function viewEmail(id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-email').style.display = 'block';

  fetch(`emails/${id}`)
  .then(response => response.json())
  .then(email => {
    //print email
    console.log(email);

    //mark email as read
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    });

    document.querySelector('#view-email-subject').innerHTML = email.subject;
    document.querySelector('#view-email-sender').innerHTML = email.sender;

    receiver = document.createElement('p');
    receiver.innerHTML = `to ${email.recipients}`;
    receiver.setAttribute('id', 'receiver');
    document.querySelector('#view-email-sender').appendChild(receiver);
    
    document.querySelector('#view-email-timestamp').innerHTML = `${email.timestamp}`;
    document.querySelector('#view-email-content').innerHTML = `${email.body}`;

    document.querySelector('#reply-button').addEventListener('click', function() {
      console.log(`Reply for ${email.id} has been clicked`);
      compose_reply(email);
    })


  });
}