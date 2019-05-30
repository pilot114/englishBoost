build:
	docker build . -t base-engboost
start:
	docker run --rm -d -v $(PWD)/app:/app -p 8080:8080 -p 8000:8000 --name engboost base-engboost
enter:
	docker exec -it -u workspace engboost bash
stop:
	docker stop engboost
