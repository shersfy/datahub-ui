package org.shersfy.datahub.ui.boot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.ComponentScan;

@EnableDiscoveryClient
@ComponentScan("org.shersfy.ui")
@SpringBootApplication
public class UIApplication {

	public static void main(String[] args) {
	    
		SpringApplication.run(UIApplication.class, args);
	}

}
