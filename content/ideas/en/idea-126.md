---
id: "idea-126"
date: "2020-02"
tags:
  - technology
  - society
  - psychology
sourceIndex: 126
---

# #SL

#SL
Algorithm
Wow, I thought for a long time. At first there was an idea to make a request to the neural network “what card should the user now be asked so that after answering it, he will know the largest number of cards?”
But this led to the fact that the neural network could always throw a new card and forget about repeating the old ones
Then I thought about making a request “which card should I ask so that learning all the cards happens in the least amount of time?”, but I couldn’t figure out how to digitalize
Then I decided that forgetting already learned cards is unprofitable (?), which means that you always need to remember the old ones. The task boiled down to the fact that there is a list of cards and the times after which they will be forgotten. You need to ask them in such an order that the least number of cards are forgotten, and at the same time the cards are in the rightmost position possible. This is already similar to the problem with a CF about a bartender and visitors who leave after some time, but there is a simpler solution
After memorizing each card, we ask the neural network “after how many cards will it be forgotten”
We reserve a place for this card through (this is the number of cards - 1) (for example, in map'e)
If the place is occupied, we go one card to the left (as in set hash tables in python), and look for the one with a lower probability of being forgotten than the current one
Of course, questions arise about the proof of this strategy. MB forget and more profitable
The question also arises, what to do with cards that were initially answered correctly? After all, we have no information about them, how long will a person forget about it?
I also doubt that forgetting depends only on the number of cards. Most likely from time to time, but you won’t take it into account
