---
id: "idea-113"
date: "2020-02"
tags:
  - technology
  - education
  - future
sourceIndex: 113
---

# #SL

#SL
By the way, check, I formulated a type of request to a neural network (probably not the most optimal solution).
The input of the neural network is a card, all the information about it, that is, the text of the card, priority, time by which it needs to be learned, the history of responses to the user’s card. The neuron returns a prediction - the user will answer true or false. (MB in the future - how well the user knows the card. Although this is the probability of the answer “yes”).
The problem remains open, which card to give the user at the moment. How to solve it? Another neural network that receives an array of cards as input and knows/doesn’t know for them and the time by which the card needs to be learned?

Should we remove the “time” parameter altogether, since we still can’t apply it without information from the user and leave only the priority? And that sounds hype. The type of user learns the highest priority first, then the least... But this will not give him the opportunity to know ~everything. For example, the user will never learn things that he needs to know all his life, because first he will have to learn something for the next test... But in general, this is a good idea - to leave time management at the discretion of the user. Look, don't go back to QL current
