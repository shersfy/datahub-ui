package org.shersfy.datahub.ui.boot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.netflix.zuul.EnableZuulProxy;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.session.config.annotation.web.http.EnableSpringHttpSession;

@EnableDiscoveryClient
@EnableZuulProxy
@EnableSpringHttpSession
@ComponentScan("org.shersfy.datahub.ui")
@SpringBootApplication
public class UIApplication {

	public static void main(String[] args) {
	    
		SpringApplication.run(UIApplication.class, args);
	}

}
