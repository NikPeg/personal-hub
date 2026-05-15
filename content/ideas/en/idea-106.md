---
id: "idea-106"
date: "2020-02"
tags:
  - technology
  - business
  - art
sourceIndex: 106
---

# #SL

#SL
Memorization
Memorization
The sum of all previous ideas in this area. An application similar to QL, where you can only:
1) add a card
2) know/don’t know
3) send the card to the archive
4) remove the card
When adding a card, you can specify by what number it should be learned or “always known.” Also possibly "priority".
v1) In the first version of the application, it asks for cards in random order. When a card is answered correctly, it is considered learned. The application asks for the learned ones after 2, 4, 8... Cards.
v2) In the second version of the application, it uses a binary search to find the required coefficient for a person. That is, not 2, 4, 8, but mb 2, 4.32, 8.67... The coefficient at which, having learned it once, a person will not forget again
v3) In the third version of the application, a neural network is created in it - an analogue of the user’s brain. Its task is to predict which card the user has forgotten at the moment. That is, either we immediately look at the coefficients of the corresponding neurons, or we constantly ask the neural network for all the cards and see which one is incorrect. If the network made a mistake and the user remembers - rebuild the network

At the bottom there may be an indicator - how many percent have been learned (in version 3 it is taken into account that I might have forgotten some old ones)

Each card has parameters: text (its length), how long since the last learning, coefficient of connection between neurons: how well you remember

It would be great to make the application cross-platform, even VKontakte and Telege bots

It’s also important to add photographs: like physics formulas could be added. And the question is a photograph, and the answer is a photograph

I was thinking of adding shortcuts: so that you open the settings and select a list of what you need to learn at the moment. But then I realized that this was not necessary: it would lead to the same unrealistically large number of modules as in QL. You can do the following: in the card settings you can specify a label; by default, the next added card will have the same label. When you change the time by which you need to know the card, the application asks: do you want to change the time on the entire shortcut "shortcut name"?
Another option is tags. Each card's settings indicate, for example, "#mathematics #algebra #parameters." When you change the time by which the card needs to be changed, a window pops up: change the time of the cards from #mathematics to “02/21/12”? Clicking on a tag opens a list of tags (you can choose which one to change), clicking on a date - selecting the date to change to
(In general, you can put this menu in a separate window, even the TimeManager type. For example, the “clock” icon in the lower (upper) part of the screen)

At the moment, the perception is this: at the bottom there is a panel, like in some Instagram, on it there are icons: add a card (+), edit the current card (pencil), TimeManager (clock) - a list of tags and the time (and priorities?) for which they are set (or an empty window, if at least one card has a time that does not coincide with all the others), cards (card symbol - classic training), search - to find the card and change it, if necessary
Icon order: cards, search, add, edit, time manager

By the way, the feed is not needed, if there is a search and hashtags - you find what you need, change it
Oh, no - right in the “magnifying glass” tab there will be a list of everything added from new to old. Convenient

You can reflect in the title that these are cards. MemoryCards? Ugh, that sounds cheap
NeuroCards? NeuroMemory? I don't fumble

You can make a design reminiscent of Instagram stories. If we really mix it up, xxx

You should also do a hashtag search! So that you can enter #math and all the math cards will open. And in the search tab, are all the cards in the order they were entered? Hmm hmm
