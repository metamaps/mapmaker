

things to figure out
-----------------
selection --> drawing the box , highlighting selected things

drawing the synapses

zooming

the carousel, double clicking to bring it up

drawing a line for synapse creation from one node to another



Metamaps.Realtime

Metamaps.Listeners

Metamaps.Synapse

Metamaps.Topic

Metamaps.Map

Metamaps.Filter

Metamaps.Control

Metamaps.Selected

Metamaps.Visualize

Metamaps.JIT

Metamaps.Settings -> defaultConfig

Metamaps.Create


map
	topicMappings []
	synapseMappings []
	topics []
	synapses []

mapView
	infoBox (mapInfoBoxView)
	topicCards
		[] topicCardView (needs template?)
	synapseCards
		[] synapseCardView (needs template?)
	filter (filterView) 
	junto (juntoView)
	newTopic (newTopicView)
		metacodeSetSwitch (metacodeSetSwitchView)
	newSynapse (newSynapseView)

	topics
		[] topicMappingView
	synapses
		[] synapseMappingView



mainContext
	translateModNode
		originModNode
			[] modNode (topicMappingView)
				imageSurface
				nameSurface
			?          (synapseMappingView)


