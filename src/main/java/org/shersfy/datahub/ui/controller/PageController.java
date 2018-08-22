package org.shersfy.datahub.ui.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class PageController {
    
    @RequestMapping("/")
    public ModelAndView index() {
        ModelAndView mv = new ModelAndView("redirect:/index.html");
        return mv;
    }
    
    @RequestMapping("/index")
    public ModelAndView index1() {
        ModelAndView mv = new ModelAndView("redirect:/index.html");
        return mv;
    }
    
    @RequestMapping("/index.html")
    public ModelAndView index2() {
        ModelAndView mv = new ModelAndView("index");
        return mv;
    }
    
    @RequestMapping("/login")
    public ModelAndView login() {
        ModelAndView mv = new ModelAndView("login");
        return mv;
    }

}
