To prepare the development environment, I modeled on this article: https://blog.wavesplatform.com/how-to-build-deploy-and-test-a-waves-ride-dapp-785311f58c2

1. You have to have docker on your system
2. Install node.js
3. install surfboard: npm install -g @waves/surfboard
4. Run a private node & explorer: docker run -d -p 6869:6869 wavesplatform/waves-private-node
5. Run an instance of Waves Explorer: docker run -d -e API_NODE_URL=http://localhost:6869 -e NODE_LIST=http://localhost:6869 -p 3000:8080 wavesplatform/explorer


Now you should have:
1. Waves Explorer available here: http://localhost:3000
2. REST API here: http://localhost:6869


To run tests in project directory just run: surfboard test path_to_file